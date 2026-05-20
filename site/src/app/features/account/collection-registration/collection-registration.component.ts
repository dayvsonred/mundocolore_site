import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import {
  ProductBrandRecord,
  ProductCollectionRecord,
  ProductService
} from 'src/app/core/services/product.service';

@Component({
  selector: 'app-collection-registration',
  templateUrl: './collection-registration.component.html',
  styleUrls: ['./collection-registration.component.scss']
})
export class CollectionRegistrationComponent implements OnInit {
  brands: ProductBrandRecord[] = [];
  collections: ProductCollectionRecord[] = [];
  loadingBrands = false;
  loadingCollections = false;
  saving = false;

  readonly form = this.formBuilder.group({
    brand: ['', Validators.required],
    collection: ['', [Validators.required, Validators.maxLength(80)]],
    slug: ['', [Validators.maxLength(80)]],
    year: [String(new Date().getFullYear()), [Validators.required, Validators.pattern(/^\d{4}$/)]],
    display_start_at: [''],
    display_end_at: ['']
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBrands();
    this.loadCollections();
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

  loadCollections(): void {
    this.loadingCollections = true;
    this.productService.getCollections()
      .pipe(finalize(() => this.loadingCollections = false))
      .subscribe({
        next: (collections) => {
          this.collections = collections;
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar as colecoes.', 'Fechar', { duration: 4000 });
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const collection = String(value.collection || '').trim();
    const displayStartAt = String(value.display_start_at || '').trim();
    const displayEndAt = String(value.display_end_at || '').trim();

    this.saving = true;
    this.productService.createCollection({
      brand: String(value.brand || '').trim(),
      collection,
      name: collection,
      slug: String(value.slug || '').trim() || undefined,
      year: String(value.year || '').trim(),
      display_start_at: displayStartAt || undefined,
      display_end_at: displayEndAt || undefined,
      release_date: displayStartAt || undefined,
      finalization_date: displayEndAt || undefined
    })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          const selectedBrand = value.brand || '';
          this.form.reset({
            brand: selectedBrand,
            collection: '',
            slug: '',
            year: String(new Date().getFullYear()),
            display_start_at: '',
            display_end_at: ''
          });
          this.snackBar.open('Colecao cadastrada.', 'Fechar', { duration: 3000 });
          this.loadCollections();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel cadastrar a colecao.', 'Fechar', { duration: 4000 });
        }
      });
  }

  getBrandLabel(value: string): string {
    const brand = this.brands.find((item) => this.getBrandValue(item) === value);
    return brand?.name || value;
  }

  getBrandValue(brand: ProductBrandRecord): string {
    return brand.brand_key || brand.brand || brand.name;
  }
}
