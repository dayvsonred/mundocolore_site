import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import {
  AnalyticsDailyPageAccessReport,
  AnalyticsService
} from '../../../core/services/analytics.service';

@Component({
  selector: 'app-admin-analytics',
  templateUrl: './admin-analytics.component.html',
  styleUrls: ['./admin-analytics.component.scss']
})
export class AdminAnalyticsComponent implements OnInit {
  selectedDay = new Date().toISOString().slice(0, 10);
  report: AnalyticsDailyPageAccessReport | null = null;
  loading = false;
  errorMessage = '';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    if (!this.selectedDay || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.analyticsService.getDailyPageAccessReport(this.selectedDay)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (report) => {
          this.report = report;
        },
        error: (error) => {
          this.report = null;
          this.errorMessage =
            error?.error?.error ||
            error?.error?.message ||
            'Nao foi possivel carregar os acessos.';
        }
      });
  }

  get pages() {
    return this.report?.pages ?? [];
  }
}
