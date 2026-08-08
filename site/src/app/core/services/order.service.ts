import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError, map } from 'rxjs';
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
  cost_unit_price?: number;
  base_unit_price?: number;
  spread_percent_at_purchase?: number;
  coupon_code?: string;
  coupon_reduction_percent?: number;
  discount_amount?: number;
  cost_subtotal?: number;
  base_subtotal?: number;
  sold_subtotal?: number;
  gross_profit_amount?: number;
  gross_margin_percent?: number;
  subtotal?: number;
  product_snapshot?: any;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  cost_subtotal?: number;
  subtotal?: number;
  sold_subtotal?: number;
  shipping_amount?: number;
  discount_amount?: number;
  coupon_code?: string;
  gross_profit_amount?: number;
  gross_margin_percent?: number;
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
  approved_at?: string;
  status_history?: OrderStatusHistory[];
}

export interface OrderStatusHistory {
  status: string;
  changed_at: string;
  changed_by: string;
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
  installments?: number;
  provider?: string;
  order_nsu?: string;
  invoice_slug?: string;
  transaction_nsu?: string;
  receipt_url?: string;
  checkout_url?: string;
  paid_amount?: number;
  actual_method?: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  coupon_code?: string;
  total: number;
  currency: string;
  billing: OrderPerson;
  customer: OrderPerson;
  delivery_address: OrderAddress;
  payment: OrderPayment;
  checkout_metadata?: any;
}

export interface CouponResponse {
  coupon_code: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount: number;
  total: number;
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

  validateCoupon(couponCode: string, items: OrderItem[], paymentMethod = ''): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(
      `${this.apiUrl}/orders/coupon`,
      { coupon_code: couponCode, items, payment_method: paymentMethod },
      { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(error)));
  }

  getAdminOrders(filters: Record<string, string | number> = {}): Observable<Order[]> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) params = params.set(key, String(value));
    });
    return this.http.get<{ orders: Order[] }>(`${this.apiUrl}/orders/admin`, {
      headers: this.getHeaders(), params
    }).pipe(map(response => response.orders || []), catchError(error => throwError(error)));
  }

  updateOrderStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/orders/admin/${encodeURIComponent(orderId)}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(catchError(error => throwError(error)));
  }
}
