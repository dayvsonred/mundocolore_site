import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { Product } from 'src/app/core/models/product.model';
import { ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  selectedProduct: Product | null = null;
  loading = false;
  saving = false;
  deleting = false;

  readonly filtersForm = this.formBuilder.group({
    search: [''],
    brand: [''],
    collection: [''],
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
    is_active: [true]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    const filters = this.filtersForm.getRawValue();
    const search = String(filters.search || '').trim();

    this.loading = true;
    this.productService.getProductsByQuery({
      produto_id: search || undefined,
      brand: String(filters.brand || '').trim() || undefined,
      collection: String(filters.collection || '').trim() || undefined,
      include_inactive: !!filters.include_inactive,
      limit: 100
    }).pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (products) => {
          const normalizedSearch = search.toLowerCase();
          this.products = normalizedSearch && !filters.search?.match(/^\d+$/)
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
      is_active: product.is_active !== false
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
      is_active: value.is_active !== false
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

  private productMatches(product: Product, search: string): boolean {
    return [
      product.name,
      product.description,
      product.produto_id,
      product.brand,
      product.collection
    ].some((value) => String(value || '').toLowerCase().includes(search));
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
