import { Inject, Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CouponStorageService {
  private readonly storageKey = 'mundocolore_coupon_code';

  constructor(@Inject('LOCALSTORAGE') private storage: Storage) {}

  getCouponCode(): string {
    try {
      return (this.storage.getItem(this.storageKey) || '').trim().toUpperCase();
    } catch {
      return '';
    }
  }

  saveCouponCode(code: string): void {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }
    try {
      this.storage.setItem(this.storageKey, normalizedCode);
    } catch {
      // The coupon remains applied for the current page if storage is unavailable.
    }
  }

  clearCouponCode(): void {
    try {
      this.storage.removeItem(this.storageKey);
    } catch {
      // Nothing else is required when storage is unavailable.
    }
  }
}
