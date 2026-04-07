import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthenticationService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }

  createOrder(items: OrderItem[], total: number): Observable<Order> {
    const body = { items, total };
    return this.http.post<Order>(`${this.apiUrl}/orders`, body, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }
}