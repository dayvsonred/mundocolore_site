import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, finalize, from, toArray } from 'rxjs';

import { Product } from 'src/app/core/models/product.model';
import { ProductBrandRecord, ProductCollectionRecord, ProductService } from 'src/app/core/services/product.service';

interface PendingProductImage {
  fileName: string;
  contentType: string;
  contentBase64: string;
}

interface RegisteredProductImage {
  name: string;
  url: string;
  isPrimary: boolean;
}

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
  uploadingImages = false;
  managingImageName = '';
  pendingImages: PendingProductImage[] = [];

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
    preco_custo: ['', [Validators.required, Validators.pattern(/^[0-9]+([.,][0-9]{1,2})?$/)]],
    spread_percent: [0, [Validators.required, Validators.min(0)]],
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
      include_cost: true,
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
    this.clearPendingImages();
    this.editForm.reset({
      name: product.name || product.description || '',
      description: product.description || '',
      produto_id: product.produto_id || '',
      brand: product.brand_key || product.brand || '',
      collection: product.collection || '',
      collection_slug: product.collection_slug || '',
      year: product.year || '',
      preco_custo: product.preco_custo || String(product.cost_price || product.price || ''),
      spread_percent: product.spread_percent || 0,
      category: product.category || 'produto',
      type: product.type || 'produto',
      tamanho_original: product.tamanho_original || '',
      tamanho_inicio: product.tamanho_inicio || null,
      tamanho_fim: product.tamanho_fim || null,
      tamanhos_array: (product.tamanhos_array || []).join(', '),
      cores: (product.cores || []).join(', '),
      imagem: this.getProductImageNames(product).join('\n'),
      is_active: product.is_active !== false,
      isNew: !!product.isNew,
      isPromotion: !!product.isPromotion
    });
  }

  clearSelection(): void {
    this.selectedProduct = null;
    this.clearPendingImages();
    this.editForm.reset();
  }

  async onProductImagesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) {
      return;
    }

    const invalidFile = files.find(file => !file.type.startsWith('image/'));
    if (invalidFile) {
      this.snackBar.open(`${invalidFile.name} nao e uma imagem valida.`, 'Fechar', { duration: 4000 });
      return;
    }

    const oversizedFile = files.find(file => file.size > 4 * 1024 * 1024);
    if (oversizedFile) {
      this.snackBar.open(`${oversizedFile.name} excede o limite de 4MB.`, 'Fechar', { duration: 4000 });
      return;
    }

    try {
      const selectedImages = await Promise.all(files.map(file => this.readPendingImage(file)));
      this.pendingImages = [...this.pendingImages, ...selectedImages];
    } catch {
      this.snackBar.open('Nao foi possivel ler uma das imagens selecionadas.', 'Fechar', { duration: 4000 });
    }
  }

  removePendingImage(index: number): void {
    this.pendingImages = this.pendingImages.filter((_image, imageIndex) => imageIndex !== index);
  }

  clearPendingImages(): void {
    this.pendingImages = [];
  }

  uploadSelectedImages(): void {
    if (!this.selectedProduct || !this.pendingImages.length || this.uploadingImages) {
      return;
    }

    const productId = this.selectedProduct.id;
    const imagesToUpload = [...this.pendingImages];
    this.uploadingImages = true;
    from(imagesToUpload).pipe(
      concatMap(image => this.productService.uploadProductImage(productId, {
        content_base64: image.contentBase64,
        content_type: image.contentType
      })),
      toArray(),
      finalize(() => this.uploadingImages = false)
    ).subscribe({
      next: (updatedProducts) => {
        const updatedProduct = updatedProducts[updatedProducts.length - 1];
        if (updatedProduct) {
          this.applyUpdatedProductImages(updatedProduct);
        }
        this.clearPendingImages();
        this.snackBar.open(
          `${imagesToUpload.length} imagem(ns) adicionada(s) ao produto.`,
          'Fechar',
          { duration: 3500 }
        );
      },
      error: () => {
        this.snackBar.open(
          'Nao foi possivel concluir o upload. As imagens anteriores ao erro podem ter sido salvas.',
          'Fechar',
          { duration: 5000 }
        );
        this.loadProducts();
      }
    });
  }

  setPrimaryProductImage(image: RegisteredProductImage): void {
    if (!this.selectedProduct || image.isPrimary || this.managingImageName) {
      return;
    }

    this.managingImageName = image.name;
    this.productService.setPrimaryProductImage(this.selectedProduct.id, image.name)
      .pipe(finalize(() => this.managingImageName = ''))
      .subscribe({
        next: (product) => {
          this.applyUpdatedProductImages(this.withPrimaryProductImage(product, image));
          this.snackBar.open('Imagem principal atualizada.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Nao foi possivel definir a imagem principal.', 'Fechar', { duration: 4000 });
        }
      });
  }

  deleteProductImage(image: RegisteredProductImage): void {
    if (!this.selectedProduct || this.managingImageName) {
      return;
    }
    if (this.getRegisteredProductImages().length <= 1) {
      this.snackBar.open('O produto precisa manter pelo menos uma imagem.', 'Fechar', { duration: 4000 });
      return;
    }

    const confirmed = window.confirm(`Excluir a imagem ${image.name}? Esta acao nao pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    this.managingImageName = image.name;
    this.productService.deleteProductImage(this.selectedProduct.id, image.name)
      .pipe(finalize(() => this.managingImageName = ''))
      .subscribe({
        next: (product) => {
          this.applyUpdatedProductImages(product);
          this.snackBar.open('Imagem excluida.', 'Fechar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Nao foi possivel excluir a imagem.', 'Fechar', { duration: 4000 });
        }
      });
  }

  getRegisteredProductImages(product: Product | null = this.selectedProduct): RegisteredProductImage[] {
    if (!product) {
      return [];
    }
    const urls = this.getProductImageUrls(product);
    const names = this.getProductImageNames(product);
    return urls.map((url, index) => ({
      url,
      name: names[index] || this.fileNameFromImageValue(url),
      isPrimary: index === 0
    }));
  }

  getProductImageUrls(product: Product | null = this.selectedProduct): string[] {
    if (!product) {
      return [];
    }
    return this.uniqueStrings([
      ...(product.image_urls || []),
      product.image_url,
      product.image
    ]).filter(image => !image.startsWith('s3://'));
  }

  getProductImageNames(product: Product | null = this.selectedProduct): string[] {
    if (!product) {
      return [];
    }
    const registeredNames = product.images || [];
    if (registeredNames.length) {
      return this.uniqueStrings(registeredNames);
    }
    return this.uniqueStrings(
      (product.image_keys || []).map(imageKey => imageKey.split('/').pop() || '')
    );
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
      preco_custo: String(value.preco_custo || '').trim(),
      spread_percent: Number(value.spread_percent || 0),
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

  private readPendingImage(file: File): Promise<PendingProductImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        fileName: file.name,
        contentType: file.type,
        contentBase64: String(reader.result || '')
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private uniqueStrings(values: Array<string | undefined | null>): string[] {
    return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
  }

  private applyUpdatedProductImages(product: Product): void {
    this.selectedProduct = product;
    this.products = this.products.map(currentProduct => currentProduct.id === product.id ? product : currentProduct);
    this.editForm.patchValue({
      imagem: this.getProductImageNames(product).join('\n')
    });
  }

  private withPrimaryProductImage(product: Product, primaryImage: RegisteredProductImage): Product {
    const currentProduct = this.selectedProduct;
    const images = this.moveImageValueToFront(
      product.images?.length ? product.images : currentProduct?.images,
      primaryImage.name
    );
    const imageKeys = this.moveImageValueToFront(
      product.image_keys?.length ? product.image_keys : currentProduct?.image_keys,
      primaryImage.name
    );
    const imageUrls = this.moveImageValueToFront(
      product.image_urls?.length ? product.image_urls : currentProduct?.image_urls,
      primaryImage.name
    );
    const mainImageUrl = imageUrls[0] || primaryImage.url;

    return {
      ...currentProduct,
      ...product,
      images,
      image_keys: imageKeys,
      image_urls: imageUrls,
      image: mainImageUrl,
      image_url: mainImageUrl
    };
  }

  private moveImageValueToFront(values: string[] | undefined, imageName: string): string[] {
    const imageValues = [...(values || [])];
    const selectedIndex = imageValues.findIndex(value =>
      this.fileNameFromImageValue(value) === this.fileNameFromImageValue(imageName)
    );
    if (selectedIndex <= 0) {
      return imageValues;
    }
    const [selectedValue] = imageValues.splice(selectedIndex, 1);
    return [selectedValue, ...imageValues];
  }

  private fileNameFromImageValue(value: string): string {
    const pathValue = String(value || '').split('?')[0];
    const fileName = pathValue.split('/').pop() || pathValue;
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }
}
