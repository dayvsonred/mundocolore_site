import { Component, Input } from '@angular/core';
import { DonationSummary } from '../../donate.models';

@Component({
  selector: 'app-donation-summary',
  templateUrl: './donation-summary.component.html',
  styleUrls: ['./donation-summary.component.scss']
})
export class DonationSummaryComponent {
  @Input() summary!: DonationSummary;
}
