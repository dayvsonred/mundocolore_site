import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

export interface ProductBrandRecord {
  id?: string;
  name: string;
  brand: string;
  brand_key?: string;
  s3_prefix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCollectionRecord {
  id?: string;
  name: string;
  slug: string;
  brand: string;
  brand_key?: string;
  year: string;
  collection_key?: string;
  display_start_at?: string;
  display_end_at?: string;
  s3_prefix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductBrandPayload {
  name: string;
  brand: string;
}

export interface CreateProductCollectionPayload {
  name?: string;
  collection: string;
  slug?: string;
  brand: string;
  year: string;
  display_start_at?: string;
  display_end_at?: string;
  release_date?: string;
  finalization_date?: string;
}

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

  getBrands(): Observable<ProductBrandRecord[]> {
    return this.http
      .get<ProductBrandRecord[] | { brands: ProductBrandRecord[] }>(`${this.apiUrl}/products/brands`)
      .pipe(
        map((response) => (Array.isArray(response) ? response : response?.brands ?? [])),
        catchError((error) => throwError(() => error))
      );
  }

  createBrand(payload: CreateProductBrandPayload): Observable<ProductBrandRecord> {
    return this.http.post<ProductBrandRecord>(`${this.apiUrl}/products/brands`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getCollections(brand?: string, year?: string): Observable<ProductCollectionRecord[]> {
    let params = new HttpParams();
    if (brand) params = params.set('brand', brand);
    if (year) params = params.set('year', year);

    return this.http
      .get<ProductCollectionRecord[] | { collections: ProductCollectionRecord[] }>(
        `${this.apiUrl}/products/collections`,
        { params }
      )
      .pipe(
        map((response) => (Array.isArray(response) ? response : response?.collections ?? [])),
        catchError((error) => throwError(() => error))
      );
  }

  createCollection(payload: CreateProductCollectionPayload): Observable<ProductCollectionRecord> {
    return this.http.post<ProductCollectionRecord>(`${this.apiUrl}/products/collections`, payload).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
