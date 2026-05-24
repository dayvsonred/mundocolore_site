import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, CartItem } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-detail-page',
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss']
})
export class ProductDetailPageComponent implements OnInit {
  product: Product | undefined;
  selectedSize = '';
  selectedColor = '';
  quantity = 1;
  validationMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.productService.getProductById(id).subscribe(product => {
      this.product = product;
      this.selectedSize = '';
      this.selectedColor = '';
      this.validationMessage = '';
    });
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

    return this.uniqueOptions([...productSizes, ...registeredSizes]);
  }

  get productColors(): string[] {
    return this.product && Array.isArray(this.product.cores)
      ? this.uniqueOptions(this.product.cores)
      : [];
  }

  get productImage(): string {
    return this.product?.image_url || this.product?.image || this.product?.image_urls?.[0] || 'assets/images/logo-mundo-colore.jpg';
  }

  getColorSwatch(color: string): string {
    const normalized = color.trim();

    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
      return normalized.startsWith('#') ? normalized : `#${normalized}`;
    }

    return normalized;
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
