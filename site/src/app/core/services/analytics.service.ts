import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from './auth.service';

export interface AnalyticsEventPayload {
  event_type: 'page_view' | 'product_view' | 'filter' | 'product_code_search' | 'brand_search' | string;
  route: string;
  page?: string;
  client_at?: string;
  ip?: string;
  referrer?: string;
  device?: string;
  language?: string;
  user?: string;
  user_id?: string;
  product_id?: string;
  product_code?: string;
  product_name?: string;
  brand?: string;
  search_code?: string;
  brand_search?: string;
  filters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsPageAccessSummary {
  route: string;
  page: string;
  accesses: number;
  last_access: string;
}

export interface AnalyticsDailyPageAccessReport {
  server_day: string;
  total_access: number;
  pages: AnalyticsPageAccessSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly endpoint = `${environment.apiUrl}/analytics_control`;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  trackPageView(route: string): Observable<unknown> {
    return this.trackEvent({
      event_type: 'page_view',
      route,
      page: route
    });
  }

  trackProductView(route: string, product: Product): Observable<unknown> {
    return this.trackEvent({
      event_type: 'product_view',
      route,
      page: route,
      product_id: product.id,
      product_code: product.produto_id || product.id,
      product_name: product.name || product.description || '',
      brand: product.brand || '',
      metadata: {
        category: product.category || '',
        type: product.type || '',
        collection: product.collection || '',
        year: product.year || ''
      }
    });
  }

  trackCatalogFilters(payload: {
    route: string;
    filters: Record<string, unknown>;
    results_count: number;
    loaded_count: number;
  }): Observable<unknown> {
    return this.trackEvent({
      event_type: 'filter',
      route: payload.route,
      page: payload.route,
      filters: payload.filters,
      metadata: {
        results_count: payload.results_count,
        loaded_count: payload.loaded_count
      }
    });
  }

  trackProductCodeSearch(route: string, searchCode: string, resultsCount: number): Observable<unknown> {
    return this.trackEvent({
      event_type: 'product_code_search',
      route,
      page: route,
      search_code: searchCode,
      product_code: searchCode,
      metadata: {
        results_count: resultsCount
      }
    });
  }

  trackBrandSearch(route: string, brandSearch: string, visibleOptionsCount: number): Observable<unknown> {
    return this.trackEvent({
      event_type: 'brand_search',
      route,
      page: route,
      brand_search: brandSearch,
      brand: brandSearch,
      metadata: {
        visible_options_count: visibleOptionsCount
      }
    });
  }

  trackEvent(payload: AnalyticsEventPayload): Observable<unknown> {
    const currentUser = this.getCurrentUser();
    const body: AnalyticsEventPayload = {
      ...payload,
      client_at: payload.client_at || new Date().toISOString(),
      ip: payload.ip || '',
      referrer: payload.referrer ?? (typeof document !== 'undefined' ? document.referrer : ''),
      device: payload.device || this.getDeviceType(),
      language: payload.language || (typeof navigator !== 'undefined' ? navigator.language : 'pt-BR'),
      user: payload.user || currentUser?.fullName || currentUser?.name || 'Visitor',
      user_id: payload.user_id || currentUser?.id || currentUser?.id_user || ''
    };

    return this.http.post<unknown>(this.endpoint, body, {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      catchError(() => EMPTY)
    );
  }

  getDailyPageAccessReport(day: string): Observable<AnalyticsDailyPageAccessReport> {
    const token = this.authService.getToken();
    let params = new HttpParams();
    if (day) {
      params = params.set('day', day);
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
    return this.http.get<AnalyticsDailyPageAccessReport>(`${this.endpoint}/reports/pages`, { params, headers });
  }

  private getCurrentUser(): any {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  private getDeviceType(): string {
    if (typeof navigator === 'undefined') {
      return 'desktop';
    }

    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
  }
}
