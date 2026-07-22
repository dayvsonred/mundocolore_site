import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, CartItem } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { OrderService } from '../../../core/services/order.service';
import { CouponStorageService } from '../../../core/services/coupon-storage.service';

@Component({
  selector: 'app-product-detail-page',
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss']
})
export class ProductDetailPageComponent implements OnInit {
  readonly defaultSize = 'UNICO';
  readonly defaultColor = '9999999';
  product: Product | undefined;
  selectedSize = '';
  selectedColor = '';
  quantity = 1;
  validationMessage = '';
  couponCode = '';
  appliedCouponCode = '';
  promotionalPrice: number | null = null;
  applyingCoupon = false;
  couponMessage = '';
  couponError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private analyticsService: AnalyticsService,
    private orderService: OrderService,
    private couponStorage: CouponStorageService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.productService.getProductById(id).subscribe(product => {
      this.product = product;
      this.selectedSize = this.productSizes.includes(this.defaultSize) ? this.defaultSize : '';
      this.selectedColor = this.productColors.includes(this.defaultColor) ? this.defaultColor : '';
      this.validationMessage = '';
      if (product) {
        this.analyticsService.trackProductView(this.router.url, product).subscribe();
        const savedCoupon = this.couponStorage.getCouponCode();
        if (savedCoupon) {
          this.couponCode = savedCoupon;
          this.applyCoupon(true);
        }
      }
    });
  }

  applyCoupon(fromSavedCoupon = false): void {
    const code = this.couponCode.trim();
    if (!this.product || !code || this.applyingCoupon) {
      if (!code) {
        this.couponError = true;
        this.couponMessage = 'Informe o codigo do cupom.';
      }
      return;
    }

    this.applyingCoupon = true;
    this.couponMessage = '';
    this.orderService.validateCoupon(code, [{
      product_id: this.product.id,
      quantity: 1,
      price: Number(this.product.price || 0)
    }]).subscribe({
      next: (response) => {
        const couponItem = response.items.find(item => item.product_id === this.product?.id);
        const unitPrice = Number(couponItem?.unit_price ?? couponItem?.price ?? this.product?.price ?? 0);
        this.appliedCouponCode = response.coupon_code;
        this.couponCode = response.coupon_code;
        this.promotionalPrice = unitPrice;
        this.couponError = false;
        this.couponMessage = `Cupom ${response.coupon_code} aplicado.`;
        this.couponStorage.saveCouponCode(response.coupon_code);
        this.applyingCoupon = false;
      },
      error: () => {
        this.appliedCouponCode = '';
        this.promotionalPrice = null;
        this.couponError = true;
        this.couponMessage = fromSavedCoupon
          ? `O cupom salvo ${code.toUpperCase()} nao e valido para este produto.`
          : 'Cupom invalido para este produto.';
        if (!fromSavedCoupon) {
          this.couponStorage.clearCouponCode();
        }
        this.applyingCoupon = false;
      }
    });
  }

  clearCoupon(): void {
    this.couponCode = '';
    this.appliedCouponCode = '';
    this.promotionalPrice = null;
    this.couponMessage = '';
    this.couponError = false;
    this.couponStorage.clearCouponCode();
  }

  onCouponCodeChange(): void {
    this.couponMessage = '';
    this.couponError = false;
    if (this.couponCode.trim().toUpperCase() !== this.appliedCouponCode) {
      this.appliedCouponCode = '';
      this.promotionalPrice = null;
    }
  }

  get savingsAmount(): number {
    if (!this.product || this.promotionalPrice === null) {
      return 0;
    }
    return Math.max(0, Number(this.product.price || 0) - this.promotionalPrice);
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    if (!this.canAddToCart) {
      this.validationMessage = 'Selecione tamanho e cor antes de adicionar ao carrinho.';
      return;
    }

    const cartItem: CartItem = {
      product: this.product,
      quantity: Math.max(1, Number(this.quantity) || 1),
      size: this.selectedSize,
      color: this.selectedColor
    };
    this.cartService.addToCart(cartItem);
    this.notificationService.openSnackBar('Produto adicionado ao carrinho.');
    this.router.navigate(['/catalog']);
  }

  goBackToCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.validationMessage = '';
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.validationMessage = '';
  }

  get canAddToCart(): boolean {
    return !!this.product
      && !!this.selectedSize
      && !!this.selectedColor
      && this.productSizes.length > 0
      && this.productColors.length > 0;
  }

  get productSizes(): string[] {
    if (!this.product) {
      return [];
    }

    const productSizes = Array.isArray(this.product.size) ? this.product.size : [];
    const registeredSizes = Array.isArray(this.product.tamanhos_array)
      ? this.product.tamanhos_array.map(size => String(size))
      : [];

    const sizes = this.uniqueOptions([...productSizes, ...registeredSizes]);
    return sizes.length ? sizes : [this.defaultSize];
  }

  get productColors(): string[] {
    if (!this.product) {
      return [];
    }
    const colors = Array.isArray(this.product.cores) ? this.uniqueOptions(this.product.cores) : [];
    return colors.length ? colors : [this.defaultColor];
  }

  get productImage(): string {
    return this.product?.image_url || this.product?.image || this.product?.image_urls?.[0] || 'assets/images/logo-mundo-colore.jpg';
  }

  getColorSwatch(color: string): string {
    if (color === this.defaultColor) {
      return '#f4ede7';
    }
    const normalized = color.trim();

    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
      return normalized.startsWith('#') ? normalized : `#${normalized}`;
    }

    return normalized;
  }

  getColorLabel(color: string): string {
    return color === this.defaultColor ? 'Cor unica' : color;
  }

  private uniqueOptions(values: Array<string | number | undefined | null>): string[] {
    const unique = new Map<string, string>();

    values.forEach(value => {
      const option = String(value || '').trim();

      if (!option) {
        return;
      }

      const key = option.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (!unique.has(key)) {
        unique.set(key, option);
      }
    });

    return [...unique.values()];
  }
}
