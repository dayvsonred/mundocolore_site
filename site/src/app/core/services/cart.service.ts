import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItems.asObservable();

  constructor() { }

  addToCart(item: CartItem): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i => i.product.id === item.product.id && i.size === item.size);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentItems.push(item);
    }
    this.cartItems.next([...currentItems]);
  }

  removeFromCart(productId: number, size: string): void {
    const currentItems = this.cartItems.value.filter(item => !(item.product.id === productId && item.size === size));
    this.cartItems.next(currentItems);
  }

  updateQuantity(productId: number, size: string, quantity: number): void {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(i => i.product.id === productId && i.size === size);
    if (item) {
      item.quantity = quantity;
      this.cartItems.next([...currentItems]);
    }
  }

  getTotal(): Observable<number> {
    return new Observable(observer => {
      this.cartItems$.subscribe(items => {
        const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        observer.next(total);
      });
    });
  }
}