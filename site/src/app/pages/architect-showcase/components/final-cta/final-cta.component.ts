import { Component, Input } from '@angular/core';
import { FinalCtaData } from '../../architect-showcase.models';

@Component({
  selector: 'app-final-cta',
  templateUrl: './final-cta.component.html',
  styleUrls: ['./final-cta.component.css']
})
export class FinalCtaComponent {
  @Input() cta!: FinalCtaData;
  @Input() eyebrow = '';
  @Input() title = '';
  @Input() description = '';
}
