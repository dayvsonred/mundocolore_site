import { Component, OnInit } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

type FilterSection = 'category' | 'size' | 'brand' | 'color' | 'price' | 'promotions';
type PromotionFilter = 'promotion' | 'new';

interface BasicCategoryRule {
  label: string;
  terms: string[];
}

@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss']
})
export class CatalogPageComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];

  readonly preferredSizeOptions = ['P', 'M', 'G', 'GG', 'XGG', 'G1', 'G2', 'G3'];
  readonly promotionFilters: Array<{ value: PromotionFilter; label: string }> = [
    { value: 'promotion', label: 'Em promocao' },
    { value: 'new', label: 'Novidades' }
  ];

  categoryOptions: string[] = [];
  brandOptions: string[] = [];
  sizeOptions: string[] = [];
  colorOptions: string[] = [];

  selectedCategories: string[] = [];
  selectedBrands: string[] = [];
  selectedSizes: string[] = [];
  selectedColors: string[] = [];
  selectedPromotions: PromotionFilter[] = [];

  brandSearch = '';
  minimumPrice: number | null = null;
  maximumPrice: number | null = null;
  isFilterDrawerOpen = false;
  sectionOpen: Record<FilterSection, boolean> = {
    category: true,
    size: true,
    brand: true,
    color: false,
    price: true,
    promotions: false
  };

  private readonly basicCategoryRules: BasicCategoryRule[] = [
    { label: 'Vestidos', terms: ['vestido'] },
    { label: 'Conjuntos', terms: ['conjunto'] },
    { label: 'Camisetas', terms: ['camiseta', 't-shirt', 'tee'] },
    { label: 'Blusas', terms: ['blusa', 'regata'] },
    { label: 'Calcas', terms: ['calca', 'legging', 'jogger'] },
    { label: 'Shorts', terms: ['short', 'bermuda'] },
    { label: 'Bodies', terms: ['body', 'bodies'] },
    { label: 'Macacoes', terms: ['macacao', 'macaquinho'] },
    { label: 'Saias', terms: ['saia'] },
    { label: 'Casacos', terms: ['casaco', 'jaqueta', 'moletom'] }
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.productService.getProducts().subscribe(products => {
      this.products = products;
      this.filteredProducts = products;
      this.buildOptions(products);
    });
  }

  get visibleBrandOptions(): string[] {
    const search = this.normalize(this.brandSearch);

    if (!search) {
      return this.brandOptions;
    }

    return this.brandOptions.filter(brand => this.normalize(brand).includes(search));
  }

  get activeFilterCount(): number {
    return this.selectedCategories.length
      + this.selectedBrands.length
      + this.selectedSizes.length
      + this.selectedColors.length
      + this.selectedPromotions.length
      + (this.minimumPrice !== null ? 1 : 0)
      + (this.maximumPrice !== null ? 1 : 0);
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  applyFilters(closeDrawer = true): void {
    this.filteredProducts = this.products.filter(product => {
      const category = this.resolveProductCategory(product);
      const sizes = this.getProductSizes(product);
      const colors = this.getProductColors(product);
      const price = this.getProductPrice(product);

      const matchesCategory = this.matchesSelectedOption(this.selectedCategories, category);
      const matchesBrand = this.matchesSelectedOption(this.selectedBrands, product.brand);
      const matchesSize = !this.selectedSizes.length
        || this.selectedSizes.some(size => sizes.some(productSize => this.sameOption(productSize, size)));
      const matchesColor = !this.selectedColors.length
        || this.selectedColors.some(color => colors.some(productColor => this.sameOption(productColor, color)));
      const matchesMinimumPrice = this.minimumPrice === null || price >= this.minimumPrice;
      const matchesMaximumPrice = this.maximumPrice === null || price <= this.maximumPrice;
      const matchesPromotion = !this.selectedPromotions.length
        || this.selectedPromotions.some(filter => this.matchesPromotion(product, filter));

      return matchesCategory
        && matchesBrand
        && matchesSize
        && matchesColor
        && matchesMinimumPrice
        && matchesMaximumPrice
        && matchesPromotion;
    });

    if (closeDrawer) {
      this.closeFilterDrawer();
    }
  }

  clearFilters(): void {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.selectedSizes = [];
    this.selectedColors = [];
    this.selectedPromotions = [];
    this.brandSearch = '';
    this.minimumPrice = null;
    this.maximumPrice = null;
    this.applyFilters(false);
  }

  toggleSection(section: FilterSection): void {
    this.sectionOpen[section] = !this.sectionOpen[section];
  }

  toggleOption(options: string[], value: string): void {
    const optionIndex = options.findIndex(option => this.sameOption(option, value));

    if (optionIndex >= 0) {
      options.splice(optionIndex, 1);
    } else {
      options.push(value);
    }

    this.applyFilters(false);
  }

  togglePromotion(value: PromotionFilter): void {
    const optionIndex = this.selectedPromotions.indexOf(value);

    if (optionIndex >= 0) {
      this.selectedPromotions.splice(optionIndex, 1);
    } else {
      this.selectedPromotions.push(value);
    }

    this.applyFilters(false);
  }

  isSelected(options: string[], value: string): boolean {
    return options.some(option => this.sameOption(option, value));
  }

  isPromotionSelected(value: PromotionFilter): boolean {
    return this.selectedPromotions.includes(value);
  }

  openFilterDrawer(): void {
    this.isFilterDrawerOpen = true;
  }

  closeFilterDrawer(): void {
    this.isFilterDrawerOpen = false;
  }

  getColorSwatch(color: string): string {
    const normalized = color.trim();

    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
      return normalized.startsWith('#') ? normalized : `#${normalized}`;
    }

    return normalized;
  }

  addToCart(product: Product): void {
    const item = {
      product,
      quantity: 1,
      size: product.size.length ? product.size[0] : ''
    };
    this.cartService.addToCart(item);
  }

  private buildOptions(products: Product[]): void {
    this.categoryOptions = this.uniqueOptions(
      products
        .map(product => this.resolveProductCategory(product))
        .filter((category): category is string => !!category)
    ).sort((first, second) => this.sortCategories(first, second));

    this.brandOptions = this.uniqueOptions(products.map(product => product.brand));

    const availableSizes = this.uniqueOptions(products.flatMap(product => this.getProductSizes(product)));
    this.sizeOptions = [
      ...this.preferredSizeOptions,
      ...availableSizes.filter(size => !this.preferredSizeOptions.some(preferred => this.sameOption(preferred, size)))
    ];

    this.colorOptions = this.uniqueOptions(products.flatMap(product => this.getProductColors(product)));
  }

  private matchesSelectedOption(selectedOptions: string[], productOption?: string): boolean {
    return !selectedOptions.length
      || !!productOption && selectedOptions.some(selectedOption => this.sameOption(selectedOption, productOption));
  }

  private matchesPromotion(product: Product, filter: PromotionFilter): boolean {
    return filter === 'promotion' ? !!product.isPromotion : !!product.isNew;
  }

  private getProductPrice(product: Product): number {
    if (Number.isFinite(product.price)) {
      return product.price;
    }

    const rawPrice = String(product.preco || '').replace(/[^\d,.-]/g, '');
    const normalizedPrice = rawPrice.includes(',')
      ? rawPrice.replace(/\./g, '').replace(',', '.')
      : rawPrice;
    const price = Number(normalizedPrice);

    return Number.isFinite(price) ? price : 0;
  }

  private getProductSizes(product: Product): string[] {
    const productSizes = Array.isArray(product.size) ? product.size : [];
    const registeredSizes = Array.isArray(product.tamanhos_array)
      ? product.tamanhos_array.map(size => String(size))
      : [];

    return this.uniqueOptions([...productSizes, ...registeredSizes]);
  }

  private getProductColors(product: Product): string[] {
    return Array.isArray(product.cores) ? this.uniqueOptions(product.cores) : [];
  }

  private resolveProductCategory(product: Product): string {
    const category = this.cleanOption(product.category);
    const productType = this.cleanOption(product.type);

    if (category && !this.isGenericProductLabel(category)) {
      return this.toBasicCategoryLabel(category);
    }

    if (productType && !this.isGenericProductLabel(productType)) {
      return this.toBasicCategoryLabel(productType);
    }

    return this.toBasicCategoryLabel(`${product.name || ''} ${product.description || ''}`, false);
  }

  private toBasicCategoryLabel(value: string, fallbackToValue = true): string {
    const normalized = this.normalize(value);
    const rule = this.basicCategoryRules.find(categoryRule =>
      categoryRule.terms.some(term => normalized.includes(term))
    );

    return rule?.label || (fallbackToValue ? value.trim() : '');
  }

  private isGenericProductLabel(value: string): boolean {
    return ['produto', 'produtos', 'product', 'products', 'roupa', 'roupas'].includes(this.normalize(value));
  }

  private uniqueOptions(values: Array<string | number | undefined | null>): string[] {
    const unique = new Map<string, string>();

    values.forEach(value => {
      const option = this.cleanOption(value);

      if (!option) {
        return;
      }

      const key = this.normalize(option);
      if (!unique.has(key)) {
        unique.set(key, option);
      }
    });

    return [...unique.values()].sort((first, second) => first.localeCompare(second, 'pt-BR'));
  }

  private sortCategories(first: string, second: string): number {
    const firstIndex = this.basicCategoryRules.findIndex(rule => rule.label === first);
    const secondIndex = this.basicCategoryRules.findIndex(rule => rule.label === second);

    if (firstIndex >= 0 && secondIndex >= 0) {
      return firstIndex - secondIndex;
    }

    if (firstIndex >= 0) {
      return -1;
    }

    if (secondIndex >= 0) {
      return 1;
    }

    return first.localeCompare(second, 'pt-BR');
  }

  private sameOption(first?: string, second?: string): boolean {
    return this.normalize(first) === this.normalize(second);
  }

  private cleanOption(value: unknown): string {
    return String(value || '').trim();
  }

  private normalize(value: unknown): string {
    return this.cleanOption(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
