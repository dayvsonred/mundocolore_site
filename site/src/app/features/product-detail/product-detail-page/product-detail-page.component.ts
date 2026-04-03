import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, CartItem } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-detail-page',
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.scss']
})
export class ProductDetailPageComponent implements OnInit {
  product: Product | undefined;
  selectedSize: string = '';
  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.productService.getProductById(id).subscribe(product => {
      this.product = product;
      if (product && product.size.length > 0) {
        this.selectedSize = product.size[0];
      }
    });
  }

  addToCart(): void {
    if (this.product && this.selectedSize) {
      const cartItem: CartItem = {
        product: this.product,
        quantity: this.quantity,
        size: this.selectedSize
      };
      this.cartService.addToCart(cartItem);
      this.router.navigate(['/cart']);
    }
  }
}