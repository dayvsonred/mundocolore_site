import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(category?: string, limit?: number, lastKey?: string): Observable<{ products: Product[], last_evaluated_key?: string }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (limit) params = params.set('limit', limit.toString());
    if (lastKey) params = params.set('last_key', lastKey);
    return this.http.get<{ products: Product[], last_evaluated_key?: string }>(`${this.apiUrl}/products`, { params }).pipe(
      catchError(error => throwError(error))
    );
  }

  getProductById(id: string): Observable<Product | undefined> {
    // Assuming a separate endpoint, but for now, get all and filter
    return this.getProducts().pipe(
      map(response => response.products.find(p => p.id === id))
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product).pipe(
      catchError(error => throwError(error))
    );
  }
}