import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ProductBrandRecord, ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-brand-registration',
  templateUrl: './brand-registration.component.html',
  styleUrls: ['./brand-registration.component.scss']
})
export class BrandRegistrationComponent implements OnInit {
  brands: ProductBrandRecord[] = [];
  loading = false;
  saving = false;

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    brand: ['', [Validators.maxLength(80)]]
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
    this.loading = true;
    this.productService.getBrands()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (brands) => {
          this.brands = brands;
        },
        error: () => {
          this.snackBar.open('Nao foi possivel carregar as marcas.', 'Fechar', { duration: 4000 });
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const name = String(value.name || '').trim();
    const brand = String(value.brand || name).trim();

    this.saving = true;
    this.productService.createBrand({ name, brand })
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          this.form.reset();
          this.snackBar.open('Marca cadastrada.', 'Fechar', { duration: 3000 });
          this.loadBrands();
        },
        error: () => {
          this.snackBar.open('Nao foi possivel cadastrar a marca.', 'Fechar', { duration: 4000 });
        }
      });
  }
}
