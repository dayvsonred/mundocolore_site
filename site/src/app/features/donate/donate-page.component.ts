import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DonationFrequency, DonationSummary, PaymentMethod, SuggestedAmount } from './donate.models';
import { PaymentsService } from 'src/app/core/services/payments.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-donate-page',
  templateUrl: './donate-page.component.html',
  styleUrls: ['./donate-page.component.scss']
})
export class DonatePageComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  campaignId = '';
  suggestedAmounts: SuggestedAmount[] = [
    { value: 5 },
    { value: 10 },
    { value: 25 },
    { value: 50 },
    { value: 100 },
    { value: 200 }
  ];

  categories = ['Doacao', 'Saude', 'Educacao', 'Emergencia'];
  frequencies: { label: string; value: DonationFrequency }[] = [
    { label: 'Unica', value: 'once' },
    { label: 'Mensal', value: 'monthly' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      frequency: ['once', Validators.required],
      category: ['Doacao', Validators.required],
      amount: [25, [Validators.required, Validators.min(5)]],
      tipPercent: [10, [Validators.min(0), Validators.max(30)]],
      paymentMethod: ['card', Validators.required],
      hideName: [false],
      anonymous: [false],
      card: this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        cardName: [''],
        country: ['Brasil'],
        postalCode: [''],
        saveCard: [false]
      })
    });

    this.form.get('paymentMethod')?.valueChanges.subscribe((method: PaymentMethod) => {
      this.toggleCardValidators(method === 'card');
    });

    this.toggleCardValidators(true);

    this.campaignId = this.route.snapshot.queryParamMap.get('campaignId')
      || this.route.snapshot.queryParamMap.get('donationId')
      || environment.defaultCampaignId
      || '';

    console.log('DonatePage init:', {
      campaignId: this.campaignId
    });
  }

  constructor(
    private fb: FormBuilder,
    private paymentsService: PaymentsService,
    private route: ActivatedRoute
  ) {}

  get summary(): DonationSummary {
    const donation = this.form.get('amount')?.value || 0;
    const tipPercent = this.form.get('tipPercent')?.value || 0;
    const tip = donation * (tipPercent / 100);
    return {
      donation,
      tip,
      total: donation + tip
    };
  }

  onFrequencyChange(value: DonationFrequency): void {
    this.form.patchValue({ frequency: value });
  }

  onAmountSelected(amount: number): void {
    this.form.patchValue({ amount });
  }

  onAmountChanged(amount: number): void {
    this.form.patchValue({ amount });
  }

  onTipChanged(percent: number): void {
    this.form.patchValue({ tipPercent: percent });
  }

  onPaymentMethodChange(method: PaymentMethod): void {
    this.form.patchValue({ paymentMethod: method });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      console.warn('Formulario invalido:', this.form.value);
      return;
    }
    if (!this.campaignId) {
      alert('CampaignId nao informado. Use /donate?campaignId=SEU_ID');
      console.warn('CampaignId ausente');
      return;
    }

    const email = this.form.get('card.email')?.value || '';
    const billingName = this.form.get('card.cardName')?.value
      || `${this.form.get('card.firstName')?.value || ''} ${this.form.get('card.lastName')?.value || ''}`.trim();
    const total = this.summary.total;

    this.isSubmitting = true;
    const currentUrl = new URL(window.location.href);
    const successUrl = new URL(currentUrl.toString());
    const cancelUrl = new URL(currentUrl.toString());
    successUrl.searchParams.set('status', 'success');
    cancelUrl.searchParams.set('status', 'cancel');

    this.paymentsService.createCheckoutSession({
      campaignId: this.campaignId,
      amount: total.toFixed(2),
      currency: 'BRL',
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      donor: {
        name: billingName || 'Doador',
        email: email || 'doador@exemplo.com'
      }
    }).subscribe({
      next: (session) => {
        this.isSubmitting = false;
        if (!session.url) {
          alert('Checkout indisponivel.');
          return;
        }
        window.location.href = session.url;
      },
      error: () => {
        this.isSubmitting = false;
        alert('Erro ao iniciar checkout.');
      }
    });
  }

  private toggleCardValidators(enabled: boolean): void {
    const cardGroup = this.form.get('card') as FormGroup;
    if (!cardGroup) return;

    Object.keys(cardGroup.controls).forEach((key) => {
      const control = cardGroup.get(key);
      if (!control) return;
      if (key === 'saveCard') return;
      if (enabled) {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
    });
  }

  get stripeReady(): boolean {
    return false;
  }
}
