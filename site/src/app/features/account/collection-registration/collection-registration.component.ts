import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import {
  ProductBrandRecord,
  ProductCollectionCoupon,
  ProductCollectionRecord,
  ProductService
} from 'src/app/core/services/product.service';

interface CollectionBrandGroup {
  brand: string;
  label: string;
  collections: ProductCollectionRecord[];
}

function couponFieldsValidator(control: AbstractControl): ValidationErrors | null {
  const code = String(control.get('code')?.value || '').trim();
  const reduction = Number(control.get('spread_reduction_percent')?.value || 0);
  return (code && reduction <= 0) || (!code && reduction > 0) ? { incompleteCoupon: true } : null;
}

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
  updating = false;
  selectedCollection: ProductCollectionRecord | null = null;

  readonly form = this.formBuilder.group({
    brand: ['', Validators.required],
    collection: ['', [Validators.required, Validators.maxLength(80)]],
    slug: ['', [Validators.maxLength(80)]],
    year: [String(new Date().getFullYear()), [Validators.required, Validators.pattern(/^\d{4}$/)]],
    display_start_at: [''],
    display_end_at: [''],
    spread_default_percent: [0, [Validators.required, Validators.min(0)]],
    coupons: this.formBuilder.array([this.createCouponGroup()])
  });

  readonly editForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    display_start_at: [''],
    display_end_at: [''],
    spread_default_percent: [0, [Validators.required, Validators.min(0)]],
    coupons: this.formBuilder.array([this.createCouponGroup()])
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
      finalization_date: displayEndAt || undefined,
      spread_default_percent: Number(value.spread_default_percent || 0),
      coupons: this.couponPayload(this.formCoupons)
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
            display_end_at: '',
            spread_default_percent: 0
          });
          this.resetCoupons(this.formCoupons);
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

  get formCoupons(): FormArray {
    return this.form.controls.coupons as FormArray;
  }

  get editCoupons(): FormArray {
    return this.editForm.controls.coupons as FormArray;
  }

  createCouponGroup(coupon?: ProductCollectionCoupon): AbstractControl {
    return this.formBuilder.group({
      code: [coupon?.code || '', Validators.maxLength(40)],
      spread_reduction_percent: [coupon?.spread_reduction_percent || 0, Validators.min(0)]
    }, { validators: couponFieldsValidator });
  }

  addCoupon(coupons: FormArray): void {
    if (coupons.length < 5) {
      coupons.push(this.createCouponGroup());
    }
  }

  removeCoupon(coupons: FormArray, index: number): void {
    coupons.removeAt(index);
    if (!coupons.length) {
      coupons.push(this.createCouponGroup());
    }
  }

  couponSummary(collection: ProductCollectionRecord): string {
    const coupons = this.collectionCoupons(collection);
    return coupons.length ? coupons.map((coupon) => coupon.code).join(', ') : '-';
  }

  get collectionGroups(): CollectionBrandGroup[] {
    const groups = new Map<string, ProductCollectionRecord[]>();
    for (const collection of this.collections) {
      const brand = collection.brand_key || collection.brand;
      groups.set(brand, [...(groups.get(brand) || []), collection]);
    }

    return Array.from(groups.entries())
      .map(([brand, collections]) => ({
        brand,
        label: this.getBrandLabel(brand),
        collections: collections.sort((left, right) =>
          left.year.localeCompare(right.year) || left.name.localeCompare(right.name)
        )
      }))
      .sort((left, right) => left.label.localeCompare(right.label));
  }

  selectCollection(collection: ProductCollectionRecord): void {
    this.selectedCollection = collection;
    this.editForm.reset({
      name: collection.name || '',
      display_start_at: collection.display_start_at || '',
      display_end_at: collection.display_end_at || '',
      spread_default_percent: collection.spread_default_percent || 0
    });
    this.resetCoupons(this.editCoupons, this.collectionCoupons(collection));
  }

  cancelEdit(): void {
    this.selectedCollection = null;
  }

  updateSelectedCollection(): void {
    if (!this.selectedCollection || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const value = this.editForm.getRawValue();
    this.updating = true;
    this.productService.updateCollection(this.selectedCollection.id || this.selectedCollection.collection_key || '', {
      name: String(value.name || '').trim(),
      display_start_at: String(value.display_start_at || '').trim(),
      display_end_at: String(value.display_end_at || '').trim(),
      spread_default_percent: Number(value.spread_default_percent || 0),
      coupon_code: '',
      coupon_spread_reduction_percent: 0,
      coupons: this.couponPayload(this.editCoupons)
    }).pipe(finalize(() => this.updating = false))
      .subscribe({
        next: (response) => {
          this.selectedCollection = response.collection;
          this.snackBar.open(
            `Colecao atualizada em ${response.updated_count} produto(s).`,
            'Fechar',
            { duration: 5000 }
          );
          this.loadCollections();
        },
        error: () => this.snackBar.open('Nao foi possivel atualizar a colecao.', 'Fechar', { duration: 4000 })
      });
  }

  private collectionCoupons(collection: ProductCollectionRecord): ProductCollectionCoupon[] {
    if (collection.coupons?.length) {
      return collection.coupons;
    }
    return collection.coupon_code && collection.coupon_spread_reduction_percent > 0
      ? [{ code: collection.coupon_code, spread_reduction_percent: collection.coupon_spread_reduction_percent }]
      : [];
  }

  private couponPayload(coupons: FormArray): ProductCollectionCoupon[] {
    return coupons.getRawValue()
      .map((coupon: ProductCollectionCoupon) => ({
        code: String(coupon.code || '').trim(),
        spread_reduction_percent: Number(coupon.spread_reduction_percent || 0)
      }))
      .filter((coupon: ProductCollectionCoupon) => coupon.code || coupon.spread_reduction_percent > 0);
  }

  private resetCoupons(coupons: FormArray, values: ProductCollectionCoupon[] = []): void {
    coupons.clear();
    for (const coupon of values.slice(0, 5)) {
      coupons.push(this.createCouponGroup(coupon));
    }
    if (!coupons.length) {
      coupons.push(this.createCouponGroup());
    }
  }
}
