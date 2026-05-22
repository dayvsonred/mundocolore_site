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

export interface CreateProductPayload {
  id?: string;
  UUID?: string;
  Number?: number;
  nome_tabela?: string;
  produto_id: string;
  name?: string;
  description?: string;
  descricao?: string;
  price?: string | number;
  preco?: string | number;
  category?: string;
  type?: string;
  brand: string;
  collection: string;
  collection_slug?: string;
  year?: string;
  release_date?: string;
  finalization_date?: string;
  tamanho_original?: string;
  tamanho_inicio?: number;
  tamanho_fim?: number;
  tamanhos_array?: number[];
  cores?: string[];
  imagem?: string[];
  image?: string;
  image_url?: string;
  images?: string[];
  image_base64?: string;
  image_file_name?: string;
  image_content_type?: string;
  stock?: number;
  is_active?: boolean;
}

export interface ProductListQuery {
  category?: string;
  type?: string;
  produto_id?: string;
  brand?: string;
  year?: string;
  collection?: string;
  include_inactive?: boolean;
  limit?: number;
  last_key?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(category?: string, limit?: number, lastKey?: string): Observable<Product[]> {
    return this.getProductsByQuery({ category, limit, last_key: lastKey });
  }

  getProductsByQuery(query: ProductListQuery = {}): Observable<Product[]> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.type) params = params.set('type', query.type);
    if (query.produto_id) params = params.set('produto_id', query.produto_id);
    if (query.brand) params = params.set('brand', query.brand);
    if (query.year) params = params.set('year', query.year);
    if (query.collection) params = params.set('collection', query.collection);
    if (query.include_inactive) params = params.set('include_inactive', 'true');
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.last_key) params = params.set('last_key', query.last_key);

    return this.http
      .get<Product[] | { products: Product[] }>(`${this.apiUrl}/products`, { params })
      .pipe(
        map((response) => (Array.isArray(response) ? response : response?.products ?? [])),
        catchError((error) => throwError(() => error))
      );
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.apiUrl}/products/${encodeURIComponent(id)}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  createProduct(product: CreateProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateProduct(id: string, product: Partial<CreateProductPayload>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${encodeURIComponent(id)}`, product).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteProduct(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(`${this.apiUrl}/products/${encodeURIComponent(id)}`).pipe(
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
