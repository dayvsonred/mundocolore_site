import { Component, Input } from '@angular/core';
import { MetricItem } from '../../architect-showcase.models';

@Component({
  selector: 'app-metrics-strip',
  templateUrl: './metrics-strip.component.html',
  styleUrls: ['./metrics-strip.component.css']
})
export class MetricsStripComponent {
  @Input() metrics: MetricItem[] = [];
  @Input() logos: string[] = [];
  @Input() ariaLabel = 'Social proof and technical capabilities';
}
