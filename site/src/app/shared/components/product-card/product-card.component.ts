import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private router: Router) {}

  get productName(): string {
    const name = String(this.product?.name || '').trim();
    return name.length > 45 ? `${name.slice(0, 45).trimEnd()}...` : name;
  }

  onViewProduct(): void {
    this.router.navigate(['/product', this.product.id]);
  }
}
