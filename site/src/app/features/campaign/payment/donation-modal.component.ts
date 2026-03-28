import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-donation-modal',
  templateUrl: './donation-modal.component.html',
  styleUrls: ['./donation-modal.component.css']
})
export class DonationModalComponent {
  donationForm: FormGroup;
  presetAmounts = [5, 10, 25, 50, 100, 200];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DonationModalComponent>,
    private notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: {
      donationId: string,
      nome_link: string,
      goalAmount?: number | string,
      currentRaised?: number | string,
      campaignTitle?: string
    }
  ) {
    this.donationForm = this.fb.group({
      amount: ['', [Validators.required, this.currencyValidator, Validators.maxLength(20)]],
      tipAmount: ['0,00', [this.currencyValidatorAllowZero, Validators.maxLength(20)]],
      paymentMethod: ['card', [Validators.required]],
      hidePublicInfo: [false],
      receiveUpdates: [true],
    });
  }

  minAmountValidator(min: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) {
        return null;
      }
      const cleanValue = control.value
        .replace('R$', '')
        .replace('.', '')
        .replace(',', '.')
        .trim();
      const numericValue = parseFloat(cleanValue);
      return numericValue >= min ? null : { min: { requiredMin: min, actual: numericValue } };
    };
  }

  submitDonation(): void {
    if (!this.donationForm.valid) {
      Object.values(this.donationForm.controls).forEach(control => control.markAsTouched());
      return;
    }

    const rawAmount = (this.donationForm.get('amount')?.value || '').trim();
    const rawTip = (this.donationForm.get('tipAmount')?.value || '').trim();

    const rawAmountSend = this.formatCurrencyForBackend(rawAmount);
    const rawTipSend = this.formatCurrencyForBackend(rawTip);

    const donationData = {
      donationId: this.data.donationId,
      nome_link: this.data.nome_link,
      amount: parseFloat(rawAmountSend),
      tipAmount: parseFloat(rawTipSend),
      paymentMethod: this.donationForm.get('paymentMethod')?.value,
      hidePublicInfo: this.donationForm.get('hidePublicInfo')?.value,
      receiveUpdates: this.donationForm.get('receiveUpdates')?.value,
      date: new Date().toISOString(),
    };

    console.log('Dados da doacao:', donationData);
    this.notificationService.openSnackBar('Doacao realizada com sucesso!');
    this.dialogRef.close(donationData);
  }

  formatCurrencyInput(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (!value) {
      value = '0';
    }

    const integerPart = value.slice(0, -2) || '0';
    const decimalPart = value.slice(-2).padStart(2, '0');

    let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (formattedInteger.length >= 3 && formattedInteger.charAt(0) == "0") {
      formattedInteger = formattedInteger.substring(1);
    }

    const formattedValue = `${formattedInteger},${decimalPart}`;
    input.value = formattedValue;
    this.donationForm.patchValue({ [controlName]: formattedValue });
  }

  currencyValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) {
      return { invalidFormat: true };
    }

    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));

    if (numericValue <= 0) {
      return { minValue: true };
    }

    return null;
  }

  currencyValidatorAllowZero(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    if (!/^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(value)) {
      return { invalidFormat: true };
    }

    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'));

    if (numericValue < 0) {
      return { minValue: true };
    }

    return null;
  }

  private formatCurrencyForBackend(value: string): string {
    if (!value) return '0.00';

    let numericValue = value.replace(/\./g, '');
    numericValue = numericValue.replace(',', '.');

    if (!numericValue.includes('.')) {
      numericValue += '.00';
    }

    return numericValue;
  }

  setPresetAmount(value: number): void {
    this.donationForm.patchValue({ amount: this.formatNumberToCurrency(value) });
  }

  selectPaymentMethod(method: string): void {
    this.donationForm.patchValue({ paymentMethod: method });
  }

  get progressAfterDonation(): number | null {
    const goal = this.parseToNumber(this.data.goalAmount);
    const current = this.parseToNumber(this.data.currentRaised);
    const amount = this.parseToNumber(this.donationForm.get('amount')?.value);

    if (!goal || goal <= 0) return null;
    const projected = current + amount;
    return Math.min((projected / goal) * 100, 100);
  }

  get donationAmountValue(): number {
    return this.parseToNumber(this.donationForm.get('amount')?.value);
  }

  get tipAmountValue(): number {
    return this.parseToNumber(this.donationForm.get('tipAmount')?.value);
  }

  get totalAmountValue(): number {
    return this.donationAmountValue + this.tipAmountValue;
  }

  formatCurrencyDisplay(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  private parseToNumber(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    const str = String(value).trim();
    if (!str) return 0;
    const normalized = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  private formatNumberToCurrency(value: number): string {
    const fixed = (value || 0).toFixed(2);
    const parts = fixed.split('.');
    const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${integer},${parts[1]}`;
  }
}
