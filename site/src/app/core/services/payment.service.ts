import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthenticationService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  method: string;
  status: string;
}

export interface InfinitePayCheckout {
  payment_id: string;
  order_id: string;
  order_nsu: string;
  checkout_url: string;
  status: string;
}

export interface InfinitePayStatus {
  payment_id: string;
  order_id: string;
  order_nsu: string;
  status: string;
  method: string;
  actual_method?: string;
  installments?: number;
  receipt_url?: string;
  transaction_nsu?: string;
  last_error?: string;
}

export interface ConfirmInfinitePayPayload {
  order_nsu: string;
  transaction_nsu: string;
  slug: string;
  receipt_url?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  createPayment(order_id: string, amount: number, method: string): Observable<Payment> {
    const body = { order_id, amount, method };
    return this.http.post<Payment>(`${this.apiUrl}/payments`, body, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }

  createInfinitePayCheckout(orderId: string): Observable<InfinitePayCheckout> {
    return this.http.post<InfinitePayCheckout>(
      `${this.apiUrl}/payments/infinitepay/checkout`,
      { order_id: orderId },
      { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(error)));
  }

  confirmInfinitePayPayment(payload: ConfirmInfinitePayPayload): Observable<InfinitePayStatus> {
    return this.http.post<InfinitePayStatus>(
      `${this.apiUrl}/payments/infinitepay/confirm`,
      payload,
      { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(error)));
  }

  getInfinitePayStatus(orderNsu: string): Observable<InfinitePayStatus> {
    return this.http.get<InfinitePayStatus>(
      `${this.apiUrl}/payments/infinitepay/status`,
      { headers: this.getHeaders(), params: { order_nsu: orderNsu } }
    ).pipe(catchError(error => throwError(error)));
  }
}
