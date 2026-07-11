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
  created_at?: string;
  updated_at?: string;
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

  private headers(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken() || ''}`);
  }
}
