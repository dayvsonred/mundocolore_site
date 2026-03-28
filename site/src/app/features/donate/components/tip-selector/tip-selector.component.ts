import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-tip-selector',
  templateUrl: './tip-selector.component.html',
  styleUrls: ['./tip-selector.component.scss']
})
export class TipSelectorComponent {
  @Input() amount = 0;
  @Input() tipPercent = 0;
  @Output() tipChanged = new EventEmitter<number>();

  onSliderChange(value: number | null): void {
    this.tipChanged.emit(value ?? 0);
  }

  get tipValue(): number {
    return (this.amount || 0) * (this.tipPercent / 100);
  }
}
