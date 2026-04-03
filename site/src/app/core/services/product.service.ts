import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { PRODUCTS_MOCK } from '../../shared/mocks/products.mock';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }

  getProducts(): Observable<Product[]> {
    return of(PRODUCTS_MOCK);
  }

  getProductById(id: number): Observable<Product | undefined> {
    const product = PRODUCTS_MOCK.find(p => p.id === id);
    return of(product);
  }
}