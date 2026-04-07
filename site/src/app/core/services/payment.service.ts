import { Injectable, Inject } from '@angular/core';
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
}