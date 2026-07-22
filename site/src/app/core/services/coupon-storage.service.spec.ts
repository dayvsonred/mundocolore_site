import { CouponStorageService } from './coupon-storage.service';

describe('CouponStorageService', () => {
  let values: Record<string, string>;
  let storage: Storage;
  let service: CouponStorageService;

  beforeEach(() => {
    values = {};
    storage = {
      get length() { return Object.keys(values).length; },
      clear: () => { values = {}; },
      getItem: (key: string) => values[key] ?? null,
      key: (index: number) => Object.keys(values)[index] ?? null,
      removeItem: (key: string) => { delete values[key]; },
      setItem: (key: string, value: string) => { values[key] = value; }
    };
    service = new CouponStorageService(storage);
  });

  it('normalizes and restores a saved coupon', () => {
    service.saveCouponCode('  colore10 ');
    expect(service.getCouponCode()).toBe('COLORE10');
  });

  it('removes the saved coupon', () => {
    service.saveCouponCode('COLORE10');
    service.clearCouponCode();
    expect(service.getCouponCode()).toBe('');
  });
});
