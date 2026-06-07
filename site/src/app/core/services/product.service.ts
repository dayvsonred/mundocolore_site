import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from './auth.service';

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
  spread_default_percent: number;
  coupon_code?: string;
  coupon_spread_reduction_percent: number;
  coupons?: ProductCollectionCoupon[];
  display_start_at?: string;
  display_end_at?: string;
  s3_prefix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductCollectionCoupon {
  code: string;
  spread_reduction_percent: number;
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
  spread_default_percent: number;
  coupon_code?: string;
  coupon_spread_reduction_percent?: number;
  coupons?: ProductCollectionCoupon[];
}

export interface UpdateProductCollectionPayload {
  name: string;
  display_start_at: string;
  display_end_at: string;
  spread_default_percent: number;
  coupon_code: string;
  coupon_spread_reduction_percent: number;
  coupons: ProductCollectionCoupon[];
}

export interface UpdateProductCollectionResponse {
  collection: ProductCollectionRecord;
  updated_count: number;
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
  cost_price?: string | number;
  preco_custo?: string | number;
  spread_percent?: number;
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
  isNew?: boolean;
  isPromotion?: boolean;
}

export interface ProductListQuery {
  category?: string;
  type?: string;
  produto_id?: string;
  brand?: string;
  year?: string;
  collection?: string;
  is_new?: boolean;
  is_promotion?: boolean;
  include_inactive?: boolean;
  include_cost?: boolean;
  limit?: number;
  last_key?: string;
}

export interface ProductListPage {
  products: Product[];
  last_evaluated_key?: string;
  last_key?: string;
}

export interface CatalogPageSnapshot {
  products: Product[];
  filteredProducts: Product[];
  nextPageKey: string;
  selectedCategories: string[];
  selectedBrands: string[];
  selectedSizes: string[];
  selectedColors: string[];
  selectedPromotions: string[];
  productCodeSearch: string;
  brandSearch: string;
  minimumPrice: number | null;
  maximumPrice: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;
  private catalogPageState: CatalogPageSnapshot | null = null;

  constructor(private http: HttpClient, private authService: AuthenticationService) {}

  private getAdminHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.authService.getToken() || ''}`);
  }

  getProducts(category?: string, limit?: number, lastKey?: string): Observable<Product[]> {
    return this.getProductsByQuery({ category, limit, last_key: lastKey }).pipe(
      map((response) => response.products)
    );
  }

  getProductsByQuery(query: ProductListQuery = {}): Observable<ProductListPage> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.type) params = params.set('type', query.type);
    if (query.produto_id) params = params.set('produto_id', query.produto_id);
    if (query.brand) params = params.set('brand', query.brand);
    if (query.year) params = params.set('year', query.year);
    if (query.collection) params = params.set('collection', query.collection);
    if (query.is_new !== undefined) params = params.set('is_new', String(query.is_new));
    if (query.is_promotion !== undefined) params = params.set('is_promotion', String(query.is_promotion));
    if (query.include_inactive) params = params.set('include_inactive', 'true');
    if (query.include_cost) params = params.set('include_cost', 'true');
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.last_key) params = params.set('last_key', query.last_key);

    return this.http
      .get<Product[] | ProductListPage>(`${this.apiUrl}/products`, {
        params,
        headers: query.include_cost ? this.getAdminHeaders() : undefined
      })
      .pipe(
        map((response) => this.normalizeProductListPage(response)),
        catchError((error) => throwError(() => error))
      );
  }

  private normalizeProductListPage(response: Product[] | ProductListPage): ProductListPage {
    if (Array.isArray(response)) {
      return { products: response };
    }

    return {
      products: response?.products ?? [],
      last_evaluated_key: response?.last_evaluated_key || response?.last_key,
      last_key: response?.last_key || response?.last_evaluated_key
    };
  }

  getProductById(id: string): Observable<Product | undefined> {
    return this.http.get<Product>(`${this.apiUrl}/products/${encodeURIComponent(id)}`).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getCatalogPageState(): CatalogPageSnapshot | null {
    return this.catalogPageState
      ? {
          products: [...this.catalogPageState.products],
          filteredProducts: [...this.catalogPageState.filteredProducts],
          nextPageKey: this.catalogPageState.nextPageKey,
          selectedCategories: [...this.catalogPageState.selectedCategories],
          selectedBrands: [...this.catalogPageState.selectedBrands],
          selectedSizes: [...this.catalogPageState.selectedSizes],
          selectedColors: [...this.catalogPageState.selectedColors],
          selectedPromotions: [...this.catalogPageState.selectedPromotions],
          productCodeSearch: this.catalogPageState.productCodeSearch,
          brandSearch: this.catalogPageState.brandSearch,
          minimumPrice: this.catalogPageState.minimumPrice,
          maximumPrice: this.catalogPageState.maximumPrice
        }
      : null;
  }

  saveCatalogPageState(state: CatalogPageSnapshot): void {
    this.catalogPageState = {
      products: [...state.products],
      filteredProducts: [...state.filteredProducts],
      nextPageKey: state.nextPageKey,
      selectedCategories: [...state.selectedCategories],
      selectedBrands: [...state.selectedBrands],
      selectedSizes: [...state.selectedSizes],
      selectedColors: [...state.selectedColors],
      selectedPromotions: [...state.selectedPromotions],
      productCodeSearch: state.productCodeSearch,
      brandSearch: state.brandSearch,
      minimumPrice: state.minimumPrice,
      maximumPrice: state.maximumPrice
    };
  }

  createProduct(product: CreateProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product, { headers: this.getAdminHeaders() }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateProduct(id: string, product: Partial<CreateProductPayload>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${encodeURIComponent(id)}`, product, { headers: this.getAdminHeaders() }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  deleteProduct(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(`${this.apiUrl}/products/${encodeURIComponent(id)}`, { headers: this.getAdminHeaders() }).pipe(
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
    return this.http.post<ProductBrandRecord>(`${this.apiUrl}/products/brands`, payload, { headers: this.getAdminHeaders() }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getCollections(brand?: string, year?: string): Observable<ProductCollectionRecord[]> {
    let params = new HttpParams();
    if (brand) params = params.set('brand', brand);
    if (year) params = params.set('year', year);
    params = params.set('include_pricing_config', 'true');

    return this.http
      .get<ProductCollectionRecord[] | { collections: ProductCollectionRecord[] }>(
        `${this.apiUrl}/products/collections`,
        { params, headers: this.getAdminHeaders() }
      )
      .pipe(
        map((response) => (Array.isArray(response) ? response : response?.collections ?? [])),
        catchError((error) => throwError(() => error))
      );
  }

  createCollection(payload: CreateProductCollectionPayload): Observable<ProductCollectionRecord> {
    return this.http.post<ProductCollectionRecord>(`${this.apiUrl}/products/collections`, payload, { headers: this.getAdminHeaders() }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  updateCollection(id: string, payload: UpdateProductCollectionPayload): Observable<UpdateProductCollectionResponse> {
    return this.http.patch<UpdateProductCollectionResponse>(
      `${this.apiUrl}/products/collections/${encodeURIComponent(id)}`,
      payload,
      { headers: this.getAdminHeaders() }
    ).pipe(catchError((error) => throwError(() => error)));
  }

  recalculateCollectionSpread(id: string): Observable<{ collection: ProductCollectionRecord; updated_count: number }> {
    return this.http.post<{ collection: ProductCollectionRecord; updated_count: number }>(
      `${this.apiUrl}/products/collections/${encodeURIComponent(id)}/recalculate-spread`,
      {},
      { headers: this.getAdminHeaders() }
    ).pipe(catchError((error) => throwError(() => error)));
  }
}
