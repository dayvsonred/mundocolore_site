import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from './auth.service';

export interface CreditColore {
  user_id: string;
  credit_limit: number;
  used_credit: number;
  available_credit: number;
  card?: ColoreCard;
  installments?: CreditInstallment[];
  history?: CreditHistory[];
  created_at?: string;
  updated_at?: string;
}

export interface ColoreCard {
  id: string;
  number: string;
  last_four: string;
  holder_name: string;
  brand: string;
  expiry_month: number;
  expiry_year: number;
  created_at: string;
}

export interface CreditInstallment {
  id: string;
  order_id: string;
  number: number;
  total: number;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string;
  paid_amount?: number;
  created_at: string;
}

export interface CreditHistory {
  amount: number;
  type: string;
  admin_user_id?: string;
  created_at: string;
}

export interface AdminCreditUser {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  created_at: string;
  credit: CreditColore;
}

export interface AdminCreditInstallment extends CreditInstallment {
  user_id: string;
  user_name: string;
  user_email: string;
}

@Injectable({ providedIn: 'root' })
export class CreditColoreService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private auth: AuthenticationService) {}

  getCredit(): Observable<CreditColore> {
    return this.http.get<CreditColore>(`${this.apiUrl}/credit-colore`, { headers: this.headers() });
  }

  getUsers(filters: Record<string, string> = {}): Observable<AdminCreditUser[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<{ users: AdminCreditUser[] }>(`${this.apiUrl}/credit-colore/admin/users`, {
      headers: this.headers(), params
    }).pipe(map(response => response.users || []));
  }

  addCredit(userId: string, amount: number): Observable<CreditColore> {
    return this.http.patch<CreditColore>(
      `${this.apiUrl}/credit-colore/admin/users/${encodeURIComponent(userId)}`,
      { amount },
      { headers: this.headers() }
    );
  }

  getAdminInstallments(filters: Record<string, string> = {}): Observable<AdminCreditInstallment[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    return this.http.get<{ installments: AdminCreditInstallment[] }>(
      `${this.apiUrl}/credit-colore/admin/installments`,
      { headers: this.headers(), params }
    ).pipe(map(response => response.installments || []));
  }

  payInstallment(installmentId: string, paidAmount?: number): Observable<CreditColore> {
    const body = paidAmount && paidAmount > 0 ? { paid_amount: paidAmount } : {};
    return this.http.patch<CreditColore>(
      `${this.apiUrl}/credit-colore/admin/installments/${encodeURIComponent(installmentId)}/pay`,
      body,
      { headers: this.headers() }
    );
  }

  private headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken() || ''}`);
  }
}
