import { Component, OnInit } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss']
})
export class CatalogPageComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  typeOptions: string[] = [];
  brandOptions: string[] = [];
  collectionOptions: string[] = [];
  sizeOptions: string[] = [];

  selectedType = '';
  selectedBrand = '';
  selectedCollection = '';
  selectedSize = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      this.filteredProducts = products;

      this.typeOptions = [...new Set(products.map(p => p.type))];
      this.brandOptions = [...new Set(products.map(p => p.brand))];
      this.collectionOptions = [...new Set(products.map(p => p.collection))];
      this.sizeOptions = [...new Set(products.flatMap(p => p.size))];
    });
  }

  onFilterChange(): void {
    this.filteredProducts = this.products.filter(product => {
      const matchesType = this.selectedType ? product.type === this.selectedType : true;
      const matchesBrand = this.selectedBrand ? product.brand === this.selectedBrand : true;
      const matchesCollection = this.selectedCollection ? product.collection === this.selectedCollection : true;
      const matchesSize = this.selectedSize ? product.size.includes(this.selectedSize) : true;
      return matchesType && matchesBrand && matchesCollection && matchesSize;
    });
  }

  clearFilters(): void {
    this.selectedType = '';
    this.selectedBrand = '';
    this.selectedCollection = '';
    this.selectedSize = '';
    this.onFilterChange();
  }

  addToCart(product: Product): void {
    const item = {
      product,
      quantity: 1,
      size: product.size.length ? product.size[0] : ''
    };
    this.cartService.addToCart(item);
  }
}