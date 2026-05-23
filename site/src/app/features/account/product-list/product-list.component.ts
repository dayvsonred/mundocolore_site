import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { Product } from 'src/app/core/models/product.model';
import { ProductBrandRecord, ProductCollectionRecord, ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  brands: ProductBrandRecord[] = [];
  collections: ProductCollectionRecord[] = [];
  products: Product[] = [];
  selectedProduct: Product | null = null;
  hasSearched = false;
  loadingBrands = false;
  loadingCollections = false;
  loading = false;
  saving = false;
  deleting = false;

  readonly filtersForm = this.formBuilder.group({
    search: [''],
    productCode: [''],
    brand: [''],
    collection: [''],
    is_new: [false],
    include_inactive: [true]
  });

  readonly editForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(180)]],
    description: ['', [Validators.required, Validators.maxLength(240)]],
    produto_id: ['', [Validators.required, Validators.maxLength(40)]],
    brand: ['', Validators.required],
    collection: ['', Validators.required],
    collection_slug: ['', Validators.required],
    year: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    preco: ['', [Validators.required, Validators.pattern(/^[0-9]+([.,][0-9]{1,2})?$/)]],
    category: ['produto', Validators.required],
    type: ['produto', Validators.required],
    tamanho_original: [''],
    tamanho_inicio: [null as number | null],
    tamanho_fim: [null as number | null],
    tamanhos_array: [''],
    cores: [''],
    imagem: [''],
    is_active: [true],
    isNew: [false],
    isPromotion: [false]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.loadingBrands = true;
    this.productService.getBrands()
      .pipe(finalize(() => this.loadingBrands = false))
      .subscribe({
        next: (brands) => {
          this.brands = brands;
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar as marcas.', 'Fechar', { duration: 4000 });
        }
      });
  }

  onBrandSelected(): void {
    this.clearSelection();
    this.collections = [];
    this.products = [];
    this.filtersForm.patchValue({ collection: '' }, { emitEvent: false });

    const brand = String(this.filtersForm.controls.brand.value || '').trim();
    if (brand) {
      this.loadCollections(brand);
      this.loadProducts();
    }
  }

  loadCollections(brand: string): void {
    this.loadingCollections = true;
    this.productService.getCollections(brand)
      .pipe(finalize(() => this.loadingCollections = false))
      .subscribe({
        next: (collections) => {
          this.collections = collections;
        },
        error: () => {
          this.collections = [];
          this.snackBar.open('Nao foi possivel carregar as colecoes da marca.', 'Fechar', { duration: 4000 });
        }
      });
  }

  loadProducts(): void {
    const filters = this.filtersForm.getRawValue();
    const search = String(filters.search || '').trim();
    const productCode = String(filters.productCode || '').trim();
    const brand = String(filters.brand || '').trim();

    if (!brand && !productCode) {
      this.products = [];
      this.hasSearched = false;
      this.snackBar.open('Selecione uma marca ou informe um codigo de produto.', 'Fechar', { duration: 3500 });
      return;
    }

    this.hasSearched = true;
    this.loading = true;
    this.productService.getProductsByQuery({
      produto_id: productCode || undefined,
      brand: brand || undefined,
      collection: String(filters.collection || '').trim() || undefined,
      is_new: filters.is_new ? true : undefined,
      include_inactive: !!filters.include_inactive,
      limit: 100
    }).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (page) => {
          const products = brand
            ? page.products.filter((product) => this.productBelongsToBrand(product, brand))
            : page.products;
          const normalizedSearch = search.toLowerCase();
          this.products = normalizedSearch
            ? products.filter((product) => this.productMatches(product, normalizedSearch))
            : products;
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar os produtos.', 'Fechar', { duration: 4000 });
        }
      });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.editForm.reset({
      name: product.name || product.description || '',
      description: product.description || '',
      produto_id: product.produto_id || '',
      brand: product.brand_key || product.brand || '',
      collection: product.collection || '',
      collection_slug: product.collection_slug || '',
      year: product.year || '',
      preco: product.preco || String(product.price || ''),
      category: product.category || 'produto',
      type: product.type || 'produto',
      tamanho_original: product.tamanho_original || '',
      tamanho_inicio: product.tamanho_inicio || null,
      tamanho_fim: product.tamanho_fim || null,
      tamanhos_array: (product.tamanhos_array || []).join(', '),
      cores: (product.cores || []).join(', '),
      imagem: (product.images || product.image_keys || []).join('\n'),
      is_active: product.is_active !== false,
      isNew: !!product.isNew,
      isPromotion: !!product.isPromotion
    });
  }

  clearSelection(): void {
    this.selectedProduct = null;
    this.editForm.reset();
  }

  saveSelectedProduct(): void {
    if (!this.selectedProduct) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const value = this.editForm.getRawValue();
    this.saving = true;
    this.productService.updateProduct(this.selectedProduct.id, {
      produto_id: String(value.produto_id || '').trim(),
      name: String(value.name || '').trim(),
      description: String(value.description || '').trim(),
      descricao: String(value.description || '').trim(),
      brand: String(value.brand || '').trim(),
      collection: String(value.collection || '').trim(),
      collection_slug: String(value.collection_slug || '').trim(),
      year: String(value.year || '').trim(),
      preco: String(value.preco || '').trim(),
      category: String(value.category || 'produto').trim(),
      type: String(value.type || 'produto').trim(),
      tamanho_original: String(value.tamanho_original || '').trim() || undefined,
      tamanho_inicio: this.toOptionalNumber(value.tamanho_inicio),
      tamanho_fim: this.toOptionalNumber(value.tamanho_fim),
      tamanhos_array: this.parseNumberList(value.tamanhos_array),
      cores: this.parseStringList(value.cores),
      imagem: this.parseStringList(value.imagem),
      is_active: value.is_active !== false,
      isNew: !!value.isNew,
      isPromotion: !!value.isPromotion
    }).pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (product) => {
          this.selectedProduct = product;
          this.snackBar.open('Produto atualizado.', 'Fechar', { duration: 3000 });
          this.loadProducts();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel atualizar o produto.', 'Fechar', { duration: 4000 });
        }
      });
  }

  setSelectedProductActive(isActive: boolean): void {
    if (!this.selectedProduct) {
      return;
    }

    this.saving = true;
    this.productService.updateProduct(this.selectedProduct.id, { is_active: isActive })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (product) => {
          this.selectedProduct = product;
          this.editForm.patchValue({ is_active: product.is_active !== false });
          this.snackBar.open(isActive ? 'Produto ativado.' : 'Produto inativado.', 'Fechar', { duration: 3000 });
          this.loadProducts();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel alterar o status do produto.', 'Fechar', { duration: 4000 });
        }
      });
  }

  deleteSelectedProduct(): void {
    if (!this.selectedProduct) {
      return;
    }
    const confirmed = window.confirm(`Excluir o produto ${this.selectedProduct.produto_id || this.selectedProduct.id}?`);
    if (!confirmed) {
      return;
    }

    this.deleting = true;
    this.productService.deleteProduct(this.selectedProduct.id)
      .pipe(finalize(() => this.deleting = false))
      .subscribe({
        next: () => {
          this.clearSelection();
          this.snackBar.open('Produto deletado.', 'Fechar', { duration: 3000 });
          this.loadProducts();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel deletar o produto.', 'Fechar', { duration: 4000 });
        }
      });
  }

  getBrandLabel(brand: ProductBrandRecord): string {
    return brand.name || brand.brand || brand.brand_key || '-';
  }

  getBrandValue(brand: ProductBrandRecord): string {
    return brand.brand_key || brand.brand || brand.name;
  }

  getCollectionLabel(collection: ProductCollectionRecord): string {
    const name = collection.name || collection.slug || collection.collection_key || '-';
    return collection.year ? `${name} / ${collection.year}` : name;
  }

  getCollectionValue(collection: ProductCollectionRecord): string {
    return collection.slug || collection.name || collection.collection_key || '';
  }

  private productMatches(product: Product, search: string): boolean {
    return [
      product.name,
      product.description,
      product.produto_id,
      product.brand,
      product.collection
    ].some((value) => String(value || '').toLowerCase().includes(search));
  }

  private productBelongsToBrand(product: Product, brand: string): boolean {
    return this.normalizeBrand(product.brand_key || product.brand || '') === this.normalizeBrand(brand);
  }

  private normalizeBrand(value: string): string {
    return value.trim().replace(/_/g, '-').replace(/\s+/g, '-').toUpperCase();
  }

  private parseStringList(value: unknown): string[] {
    return String(value || '')
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private parseNumberList(value: unknown): number[] {
    return this.parseStringList(value)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || String(value).trim() === '') {
      return undefined;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }
}
