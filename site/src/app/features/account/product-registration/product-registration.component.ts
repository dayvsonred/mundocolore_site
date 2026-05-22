import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import {
  ProductBrandRecord,
  ProductCollectionRecord,
  ProductService
} from 'src/app/core/services/product.service';

@Component({
  selector: 'app-product-registration',
  templateUrl: './product-registration.component.html',
  styleUrls: ['./product-registration.component.scss']
})
export class ProductRegistrationComponent implements OnInit {
  brands: ProductBrandRecord[] = [];
  collections: ProductCollectionRecord[] = [];
  selectedBrand: ProductBrandRecord | null = null;
  imagePreview = '';
  imageFileName = '';
  imageBase64 = '';
  imageContentType = '';
  loadingBrands = false;
  loadingCollections = false;
  saving = false;

  private routeBrand = '';

  readonly form = this.formBuilder.group({
    collection: [null, Validators.required],
    Number: [null],
    UUID: [''],
    produto_id: ['', [Validators.required, Validators.maxLength(40)]],
    descricao: ['', [Validators.required, Validators.maxLength(180)]],
    tamanho_original: ['', [Validators.maxLength(40)]],
    tamanho_inicio: [null],
    tamanho_fim: [null],
    tamanhos_array: [''],
    preco: ['', [Validators.required, Validators.pattern(/^[0-9]+([.,][0-9]{1,2})?$/)]],
    imagem: [''],
    cores: ['']
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.routeBrand = params.get('brand') || '';
      this.resolveSelectedBrand();
    });

    this.loadBrands();
  }

  loadBrands(): void {
    this.loadingBrands = true;
    this.productService.getBrands()
      .pipe(finalize(() => this.loadingBrands = false))
      .subscribe({
        next: (brands) => {
          this.brands = brands;
          this.resolveSelectedBrand();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar as marcas.', 'Fechar', { duration: 4000 });
        }
      });
  }

  loadCollections(brand: ProductBrandRecord): void {
    this.loadingCollections = true;
    this.collections = [];
    this.form.patchValue({ collection: null });

    this.productService.getCollections(this.getBrandValue(brand))
      .pipe(finalize(() => this.loadingCollections = false))
      .subscribe({
        next: (collections) => {
          this.collections = collections;
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar as colecoes da marca.', 'Fechar', { duration: 4000 });
        }
      });
  }

  selectBrand(brand: ProductBrandRecord): void {
    this.router.navigate(['/minha-conta/cadastro-produtos', this.getRouteToken(brand)]);
  }

  backToBrands(): void {
    this.router.navigate(['/minha-conta/cadastro-produtos']);
  }

  submit(): void {
    if (!this.selectedBrand) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const collection = value.collection as unknown as ProductCollectionRecord;
    const description = String(value.descricao || '').trim();
    const sizeStart = this.toOptionalNumber(value.tamanho_inicio);
    const sizeEnd = this.toOptionalNumber(value.tamanho_fim);
    const sizes = this.parseNumberList(value.tamanhos_array);
    const sizesArray = sizes.length ? sizes : this.buildSizeRange(sizeStart, sizeEnd);

    this.saving = true;
    this.productService.createProduct({
      Number: this.toOptionalNumber(value.Number),
      UUID: this.toOptionalString(value.UUID),
      nome_tabela: this.getBrandLabel(this.selectedBrand),
      produto_id: String(value.produto_id || '').trim(),
      name: description,
      description,
      descricao: description,
      category: 'produto',
      type: 'produto',
      brand: this.getBrandValue(this.selectedBrand),
      collection: collection.name || collection.slug,
      collection_slug: collection.slug,
      year: collection.year,
      preco: String(value.preco || '').trim(),
      tamanho_original: this.toOptionalString(value.tamanho_original),
      tamanho_inicio: sizeStart,
      tamanho_fim: sizeEnd,
      tamanhos_array: sizesArray,
      imagem: this.parseStringList(value.imagem),
      image_base64: this.imageBase64 || undefined,
      image_file_name: this.imageFileName || undefined,
      image_content_type: this.imageContentType || undefined,
      cores: this.parseStringList(value.cores),
      stock: 0
    }).pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const selectedCollection = value.collection;
          this.form.reset({
            collection: selectedCollection,
            Number: null,
            UUID: '',
            produto_id: '',
            descricao: '',
            tamanho_original: '',
            tamanho_inicio: null,
            tamanho_fim: null,
            tamanhos_array: '',
            preco: '',
            imagem: '',
            cores: ''
          });
          this.clearSelectedImage();
          this.snackBar.open('Produto cadastrado.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Nao foi possivel cadastrar o produto.', 'Fechar', { duration: 4000 });
        }
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.clearSelectedImage();
      input.value = '';
      this.snackBar.open('Selecione uma imagem valida.', 'Fechar', { duration: 3000 });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      this.clearSelectedImage();
      input.value = '';
      this.snackBar.open('Use uma imagem com ate 4MB.', 'Fechar', { duration: 4000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      this.imagePreview = result;
      this.imageBase64 = result;
      this.imageFileName = file.name;
      this.imageContentType = file.type;
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage(input?: HTMLInputElement): void {
    this.imagePreview = '';
    this.imageBase64 = '';
    this.imageFileName = '';
    this.imageContentType = '';
    if (input) {
      input.value = '';
    }
  }

  getBrandLabel(brand: ProductBrandRecord): string {
    return brand.name || brand.brand || brand.brand_key || '-';
  }

  getBrandValue(brand: ProductBrandRecord): string {
    return brand.brand_key || brand.brand || brand.name;
  }

  getRouteToken(brand: ProductBrandRecord): string {
    return this.slugify(this.getBrandValue(brand));
  }

  getCollectionLabel(collection: ProductCollectionRecord): string {
    return `${collection.name || collection.slug} / ${collection.year}`;
  }

  private resolveSelectedBrand(): void {
    if (!this.routeBrand) {
      this.selectedBrand = null;
      this.collections = [];
      this.clearSelectedImage();
      this.form.reset({
        collection: null,
        Number: null,
        UUID: '',
        produto_id: '',
        descricao: '',
        tamanho_original: '',
        tamanho_inicio: null,
        tamanho_fim: null,
        tamanhos_array: '',
        preco: '',
        imagem: '',
        cores: ''
      });
      return;
    }

    if (!this.brands.length) {
      return;
    }

    const selected = this.brands.find((brand) => {
      const routeToken = this.slugify(this.routeBrand);
      return [
        brand.name,
        brand.brand,
        brand.brand_key,
        this.getRouteToken(brand)
      ].some((value) => this.slugify(value || '') === routeToken);
    }) || null;

    if (!selected) {
      this.router.navigate(['/minha-conta/cadastro-produtos']);
      return;
    }

    if (this.selectedBrand && this.getBrandValue(this.selectedBrand) === this.getBrandValue(selected)) {
      return;
    }

    this.selectedBrand = selected;
    this.clearSelectedImage();
    this.loadCollections(selected);
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

  private buildSizeRange(start?: number, end?: number): number[] {
    if (start === undefined || end === undefined || end < start) {
      return [];
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  private toOptionalNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || String(value).trim() === '') {
      return undefined;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private toOptionalString(value: unknown): string | undefined {
    const text = String(value || '').trim();
    return text || undefined;
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
