import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthenticationService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  product_id: string;
  product_code?: string;
  product_name?: string;
  product_image?: string;
  brand?: string;
  collection?: string;
  category?: string;
  type?: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  unit_price?: number;
  subtotal?: number;
  product_snapshot?: any;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total: number;
  currency?: string;
  status: string;
  billing?: OrderPerson;
  customer?: OrderPerson;
  delivery_address?: OrderAddress;
  payment?: OrderPayment;
  checkout_metadata?: any;
  purchase_ip?: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderPerson {
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
}

export interface OrderAddress {
  id?: string;
  observation?: string;
  complement?: string;
  number: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  country?: string;
  zip_code: string;
  is_default?: boolean;
}

export interface OrderPayment {
  method: string;
  label: string;
  amount: number;
  status?: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  billing: OrderPerson;
  customer: OrderPerson;
  delivery_address: OrderAddress;
  payment: OrderPayment;
  checkout_metadata?: any;
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

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, payload, { headers: this.getHeaders() }).pipe(
      catchError(error => throwError(error))
    );
  }
}
