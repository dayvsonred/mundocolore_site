import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SuggestedAmount } from '../../donate.models';

@Component({
  selector: 'app-donation-amount-selector',
  templateUrl: './donation-amount-selector.component.html',
  styleUrls: ['./donation-amount-selector.component.scss']
})
export class DonationAmountSelectorComponent implements OnChanges {
  @Input() amount = 0;
  @Input() suggestedAmounts: SuggestedAmount[] = [];
  @Output() amountSelected = new EventEmitter<number>();
  @Output() amountChanged = new EventEmitter<number>();

  amountDisplay = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amount']) {
      this.amountDisplay = this.formatCurrency(this.amount);
    }
  }

  selectAmount(value: number): void {
    this.amountSelected.emit(value);
  }

  onInputChange(value: string): void {
    const numeric = this.parseCurrency(value);
    this.amountDisplay = this.formatNumber(numeric);
    this.amountChanged.emit(numeric);
  }

  isSelected(value: number): boolean {
    return Math.round(this.amount) === value;
  }

  private parseCurrency(value: string): number {
    if (!value) return 0;
    const digits = value.replace(/\D/g, '');
    if (!digits) return 0;
    const number = parseInt(digits, 10) / 100;
    return isNaN(number) ? 0 : number;
  }

  private formatCurrency(value: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private formatNumber(value: number): string {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
