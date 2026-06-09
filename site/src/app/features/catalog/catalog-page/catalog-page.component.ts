import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { CatalogPageSnapshot, ProductService } from '../../../core/services/product.service';

type FilterSection = 'code' | 'category' | 'size' | 'brand' | 'color' | 'price' | 'promotions';
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

  readonly pageSize = 24;
  readonly minimumFilteredPageSize = 4;
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

  productCodeSearch = '';
  brandSearch = '';
  minimumPrice: number | null = null;
  maximumPrice: number | null = null;
  nextPageKey = '';
  isLoadingProducts = false;
  isLoadingMoreProducts = false;
  isSearchingFilteredProducts = false;
  productLoadError = '';
  isFilterDrawerOpen = false;
  sectionOpen: Record<FilterSection, boolean> = {
    code: false,
    category: false,
    size: false,
    brand: false,
    color: false,
    price: false,
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
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.loadProducts(true);
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
      + (this.productCodeSearch.trim() ? 1 : 0)
      + (this.minimumPrice !== null ? 1 : 0)
      + (this.maximumPrice !== null ? 1 : 0);
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  get hasMoreProducts(): boolean {
    return !!this.nextPageKey;
  }

  get isLoadingAnyProducts(): boolean {
    return this.isLoadingProducts || this.isLoadingMoreProducts;
  }

  async loadProducts(reset = false): Promise<void> {
    if (this.isLoadingAnyProducts) {
      return;
    }

    if (!reset && !this.nextPageKey) {
      return;
    }

    if (reset) {
      const savedCatalogState = this.productService.getCatalogPageState();

      if (savedCatalogState) {
        this.restoreCatalogState(savedCatalogState);
        return;
      }
    }

    this.productLoadError = '';
    this.isLoadingProducts = reset;
    this.isLoadingMoreProducts = !reset;
    this.isSearchingFilteredProducts = !reset && this.hasActiveFilters;

    try {
      if (reset) {
        await this.loadProductPage(undefined, true);
        return;
      }

      const targetFilteredCount = this.hasActiveFilters
        ? this.filteredProducts.length + this.minimumFilteredPageSize
        : 0;

      await this.loadProductPage(this.nextPageKey, false);

      if (this.hasActiveFilters) {
        await this.loadUntilFilteredCount(targetFilteredCount);
      }
    } catch {
      this.productLoadError = reset
        ? 'Nao foi possivel carregar os produtos.'
        : 'Nao foi possivel carregar mais produtos.';
    } finally {
      this.isLoadingProducts = false;
      this.isLoadingMoreProducts = false;
      this.isSearchingFilteredProducts = false;
    }
  }

  applyFilters(closeDrawer = true, ensureMinimum = false): void {
    this.filteredProducts = this.products.filter(product => {
      const category = this.resolveProductCategory(product);
      const sizes = this.getProductSizes(product);
      const colors = this.getProductColors(product);
      const price = this.getProductPrice(product);
      const productCode = this.normalize(this.productCodeSearch);

      const matchesCode = !productCode || this.normalize(product.produto_id || product.id).includes(productCode);
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

      return matchesCode
        && matchesCategory
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

    this.saveCatalogState();

    if (ensureMinimum && this.hasActiveFilters && this.filteredProducts.length < this.minimumFilteredPageSize) {
      this.ensureMinimumFilteredProducts();
    }
  }

  clearFilters(): void {
    this.selectedCategories = [];
    this.selectedBrands = [];
    this.selectedSizes = [];
    this.selectedColors = [];
    this.selectedPromotions = [];
    this.productCodeSearch = '';
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
    if (color === '9999999') {
      return '#f4ede7';
    }
    const normalized = color.trim();

    if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized)) {
      return normalized.startsWith('#') ? normalized : `#${normalized}`;
    }

    return normalized;
  }

  getColorLabel(color: string): string {
    return color === '9999999' ? 'Cor unica' : color;
  }

  private async ensureMinimumFilteredProducts(): Promise<void> {
    if (this.isLoadingAnyProducts || !this.nextPageKey) {
      return;
    }

    this.productLoadError = '';
    this.isLoadingMoreProducts = true;
    this.isSearchingFilteredProducts = true;

    try {
      await this.loadUntilFilteredCount(this.minimumFilteredPageSize);
    } catch {
      this.productLoadError = 'Nao foi possivel buscar mais produtos para esse filtro.';
    } finally {
      this.isLoadingMoreProducts = false;
      this.isSearchingFilteredProducts = false;
    }
  }

  private async loadUntilFilteredCount(targetFilteredCount: number): Promise<void> {
    while (this.nextPageKey && this.filteredProducts.length < targetFilteredCount) {
      const currentPageKey = this.nextPageKey;
      await this.loadProductPage(currentPageKey, false);

      if (this.nextPageKey === currentPageKey) {
        break;
      }
    }
  }

  private async loadProductPage(lastKey: string | undefined, reset: boolean): Promise<void> {
    const page = await firstValueFrom(this.productService.getProductsByQuery({
      limit: this.pageSize,
      last_key: lastKey
    }));

    this.products = reset ? page.products : [...this.products, ...page.products];
    this.nextPageKey = page.last_evaluated_key || page.last_key || '';
    this.buildOptions(this.products);
    this.applyFilters(false);
  }

  private restoreCatalogState(savedCatalogState: CatalogPageSnapshot): void {
    this.products = [...savedCatalogState.products];
    this.filteredProducts = [...savedCatalogState.filteredProducts];
    this.nextPageKey = savedCatalogState.nextPageKey;

    this.selectedCategories = [...savedCatalogState.selectedCategories];
    this.selectedBrands = [...savedCatalogState.selectedBrands];
    this.selectedSizes = [...savedCatalogState.selectedSizes];
    this.selectedColors = [...savedCatalogState.selectedColors];
    this.selectedPromotions = [...savedCatalogState.selectedPromotions] as PromotionFilter[];
    this.productCodeSearch = savedCatalogState.productCodeSearch || '';
    this.brandSearch = savedCatalogState.brandSearch;
    this.minimumPrice = savedCatalogState.minimumPrice;
    this.maximumPrice = savedCatalogState.maximumPrice;

    this.buildOptions(this.products);
    this.productLoadError = '';
    this.isLoadingProducts = false;
    this.isLoadingMoreProducts = false;
    this.isSearchingFilteredProducts = false;
  }

  private saveCatalogState(): void {
    this.productService.saveCatalogPageState({
      products: [...this.products],
      filteredProducts: [...this.filteredProducts],
      nextPageKey: this.nextPageKey,
      selectedCategories: [...this.selectedCategories],
      selectedBrands: [...this.selectedBrands],
      selectedSizes: [...this.selectedSizes],
      selectedColors: [...this.selectedColors],
      selectedPromotions: [...this.selectedPromotions],
      productCodeSearch: this.productCodeSearch,
      brandSearch: this.brandSearch,
      minimumPrice: this.minimumPrice,
      maximumPrice: this.maximumPrice
    });
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
