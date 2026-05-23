import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { NotificationService } from 'src/app/core/services/notification.service';
import { APP_NAME } from 'src/app/core/constants/branding';
import { Product } from 'src/app/core/models/product.model';
import { ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly appName = APP_NAME;
  readonly currentYear = new Date().getFullYear();

  readonly heroSlides: ReadonlyArray<HeroSlide> = [
    {
      title: 'Cor, conforto e alegria em cada momento da infancia',
      subtitle: 'Uma colecao de lancamento com tecidos macios e essenciais inspirados no arco-iris.',
      cta: 'Comprar novidades',
      backgroundImage:
        'https://plus.unsplash.com/premium_photo-1773087816035-97634663a926?q=80&w=1170&auto=format'
    },
    {
      title: 'Tons pasteis e looks felizes para aventuras de todos os dias',
      subtitle: 'Criado para movimento, feito para sorrisos e pronto para escola e fim de semana.',
      cta: 'Explorar colecoes',
      backgroundImage:
        'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Mundo Colore Store ja esta no ar',
      subtitle: 'Descubra moda infantil moderna, com detalhes arredondados e identidade colorida.',
      cta: 'Ver promocoes',
      backgroundImage:
        'https://plus.unsplash.com/premium_photo-1772784452662-08b64c0bd038?q=80&w=1170&auto=format'
        //'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=80'
    }
  ];

  readonly featuredCards: ReadonlyArray<FeaturedCard> = [
    {
      title: 'Novidades',
      description: 'Lancamentos para bebes e criancas com algodao respiravel e acabamento pastel.',
      badgeColor: 'var(--primary-red)'
    },
    {
      title: 'Colecao Colorida',
      description: 'Looks inspirados no arco-iris, com combinacoes leves e divertidas.',
      badgeColor: 'var(--primary-blue)'
    },
    {
      title: 'Promocoes',
      description: 'Precos especiais em looks selecionados, kits e combos sazonais.',
      badgeColor: 'var(--primary-orange)'
    }
  ];

  readonly benefits: ReadonlyArray<BenefitItem> = [
    { icon: 'local_shipping', title: 'Entrega Rapida', text: 'Despacho em ate 24h para regioes selecionadas.' },
    { icon: 'verified', title: 'Qualidade Premium', text: 'Materiais seguros, macios e duraveis para uso diario.' },
    { icon: 'eco', title: 'Sustentavel', text: 'Producao responsavel e embalagens de baixo impacto.' }
  ];

  readonly lifestylePhotos: ReadonlyArray<string> = [
    'https://images.unsplash.com/photo-1476234251651-f353703a034d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1516627145497-ae6968895b9a?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=80'
  ];

  readonly footerLinks: ReadonlyArray<FooterLink> = [
    { label: 'Inicio', sectionId: 'home' },
    { label: 'Colecoes', sectionId: 'collections' },
    { label: 'Novidades', sectionId: 'arrivals' },
    { label: 'Contato', sectionId: 'contact' }
  ];

  readonly socialLinks: ReadonlyArray<SocialLink> = [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
    { label: 'Pinterest', href: 'https://pinterest.com' }
  ];

  isNavbarSolid = false;
  activeSlideIndex = 0;
  products: Product[] = [];
  loadingProducts = false;
  productLoadError = '';
  newsletterForm: FormGroup;

  private heroIntervalId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly notificationService: NotificationService,
    private readonly productService: ProductService,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly meta: Meta
  ) {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.titleService.setTitle('mundocolorestore - Moda infantil colorida');
    this.meta.updateTag({
      name: 'description',
      content: 'Mundo Colore Store: ecommerce infantil com colecoes coloridas, confortaveis e modernas.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'mundocolorestore, roupas infantis, moda infantil, colecao colorida, ecommerce'
    });
  }

  ngOnInit(): void {
    this.loadNewProducts();
    this.startHeroAutoSlide();
    this.onWindowScroll();
  }

  ngOnDestroy(): void {
    this.stopHeroAutoSlide();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isNavbarSolid = window.scrollY > 24;
  }

  scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  goToSlide(index: number): void {
    this.activeSlideIndex = index;
    this.restartHeroAutoSlide();
  }

  onNewsletterSubmit(): void {
    if (this.newsletterForm.invalid) {
      this.newsletterForm.markAllAsTouched();
      this.notificationService.openSnackBar('Informe um e-mail valido para receber novidades.');
      return;
    }

    this.notificationService.openSnackBar('Cadastro realizado! Em breve voce recebera as novidades da Mundo Colore.');
    this.newsletterForm.reset();
  }

  getProductImage(product: Product): string {
    return product.image_url || product.image || product.image_urls?.[0] || 'assets/images/logo-mundo-colore.jpg';
  }

  getProductName(product: Product): string {
    return product.name || product.description || product.produto_id || 'Produto Mundo Colore';
  }

  getProductPrice(product: Product): string {
    const price = this.resolveProductPrice(product);

    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  viewProduct(product: Product, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!product.id) {
      return;
    }

    this.router.navigate(['/product', product.id]);
  }

  private loadNewProducts(): void {
    this.loadingProducts = true;
    this.productLoadError = '';

    this.productService.getProductsByQuery({
      is_new: true,
      include_inactive: false,
      limit: 100
    }).pipe(finalize(() => this.loadingProducts = false))
      .subscribe({
        next: (page) => {
          this.products = page.products.filter((product) => !!product.isNew).slice(0, 8);
        },
        error: () => {
          this.products = [];
          this.productLoadError = 'Nao foi possivel carregar as novidades.';
        }
      });
  }

  private nextSlide(): void {
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.heroSlides.length;
  }

  private startHeroAutoSlide(): void {
    this.heroIntervalId = window.setInterval(() => {
      this.nextSlide();
    }, 5500);
  }

  private stopHeroAutoSlide(): void {
    if (typeof this.heroIntervalId === 'number') {
      window.clearInterval(this.heroIntervalId);
      this.heroIntervalId = undefined;
    }
  }

  private restartHeroAutoSlide(): void {
    this.stopHeroAutoSlide();
    this.startHeroAutoSlide();
  }

  private resolveProductPrice(product: Product): number {
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
}

interface MenuItem {
  id: string;
  label: string;
}

interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  backgroundImage: string;
}

interface FeaturedCard {
  title: string;
  description: string;
  badgeColor: string;
}

interface BenefitItem {
  icon: string;
  title: string;
  text: string;
}

interface FooterLink {
  label: string;
  sectionId: string;
}

interface SocialLink {
  label: string;
  href: string;
}
