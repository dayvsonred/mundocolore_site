import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(category?: string, limit?: number, lastKey?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (limit) params = params.set('limit', limit.toString());
    if (lastKey) params = params.set('last_key', lastKey);

    return this.http
      .get<Product[] | { products: Product[] }>(`${this.apiUrl}/products`, { params })
      .pipe(
        map((response) => (Array.isArray(response) ? response : response?.products ?? [])),
        catchError((error) => throwError(() => error))
      );
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.getProducts().pipe(
      map((products) => products.find((product) => product.id === id))
    );
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
