import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService } from 'src/app/core/services/product.service';

interface ProductBrand {
  label: string;
  slug: string;
}

@Component({
  selector: 'app-product-registration',
  templateUrl: './product-registration.component.html',
  styleUrls: ['./product-registration.component.scss']
})
export class ProductRegistrationComponent implements OnInit {
  readonly brands: ProductBrand[] = [
    { label: 'UP-BABY', slug: 'up-baby' },
    { label: '3EJA', slug: '3eja' },
    { label: 'QUIMIBY', slug: 'quimiby' },
    { label: 'PRECOCE', slug: 'precoce' }
  ];

  selectedBrand: ProductBrand | null = null;
  imagePreview = '';
  imageFileName = '';
  saving = false;

  readonly form = this.formBuilder.group({
    release_date: ['', Validators.required],
    finalization_date: ['', Validators.required],
    collection: ['', [Validators.required, Validators.maxLength(80)]],
    image_url: ['', Validators.required]
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
      const brandSlug = params.get('brand');
      this.selectedBrand = brandSlug
        ? this.brands.find((brand) => brand.slug === brandSlug) || null
        : null;

      if (brandSlug && !this.selectedBrand) {
        this.router.navigate(['/minha-conta/cadastro-produtos']);
      }
    });
  }

  selectBrand(brand: ProductBrand): void {
    this.router.navigate(['/minha-conta/cadastro-produtos', brand.slug]);
  }

  backToBrands(): void {
    this.router.navigate(['/minha-conta/cadastro-produtos']);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.form.patchValue({ image_url: '' });
      this.imagePreview = '';
      this.imageFileName = '';
      this.snackBar.open('Selecione uma imagem valida.', 'Fechar', { duration: 3000 });
      return;
    }

    this.imageFileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || '');
      this.imagePreview = imageUrl;
      this.form.patchValue({ image_url: imageUrl });
      this.form.controls.image_url.markAsTouched();
    };
    reader.readAsDataURL(file);
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
    const collection = String(value.collection || '').trim();

    this.saving = true;
    this.productService.createProduct({
      name: `${this.selectedBrand.label} - ${collection}`,
      description: collection,
      price: 0,
      category: this.selectedBrand.label,
      brand: this.selectedBrand.label,
      collection,
      release_date: value.release_date || '',
      finalization_date: value.finalization_date || '',
      image: value.image_url || '',
      image_url: value.image_url || '',
      stock: 0
    } as any).subscribe({
      next: () => {
        this.saving = false;
        this.form.reset();
        this.imagePreview = '';
        this.imageFileName = '';
        this.snackBar.open('Produto cadastrado.', 'Fechar', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Nao foi possivel cadastrar o produto.', 'Fechar', { duration: 4000 });
      }
    });
  }
}
