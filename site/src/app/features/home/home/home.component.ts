import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';

import { NotificationService } from 'src/app/core/services/notification.service';
import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly appName = APP_NAME;
  readonly currentYear = new Date().getFullYear();
  readonly logoPath = 'assets/images/logo-mundo-colore.jpg';

  readonly menuItems: ReadonlyArray<MenuItem> = [
    { id: 'home', label: 'Inicio' },
    { id: 'collections', label: 'Colecoes' },
    { id: 'arrivals', label: 'Novidades' },
    { id: 'promotions', label: 'Promocoes' },
    { id: 'contact', label: 'Contato' }
  ];

  readonly heroSlides: ReadonlyArray<HeroSlide> = [
    {
      title: 'Cor, conforto e alegria em cada momento da infancia',
      subtitle: 'Uma colecao de lancamento com tecidos macios e essenciais inspirados no arco-iris.',
      cta: 'Comprar novidades',
      backgroundImage:
        'https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&w=1600&q=80'
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
        'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=1600&q=80'
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

  readonly products: ReadonlyArray<ProductCard> = [
    { name: 'Conjunto Moletom Arco-iris', price: 'R$ 149,90', image: 'https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&w=800&q=80' },
    { name: 'Vestido Jardim Suave', price: 'R$ 129,90', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80' },
    { name: 'Shorts Dia de Sol', price: 'R$ 79,90', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80' },
    { name: 'Pijama Nuvem Duo', price: 'R$ 99,90', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Jaqueta Pequeno Explorador', price: 'R$ 169,90', image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Conjunto Tricot Candy', price: 'R$ 139,90', image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80' },
    { name: 'Kit Camisetas Brincar', price: 'R$ 89,90', image: 'https://images.unsplash.com/photo-1620799139652-715e4d5b232d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Jardineira Mini Arco-iris', price: 'R$ 119,90', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80' }
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
  mobileMenuOpen = false;
  activeSlideIndex = 0;
  newsletterForm: FormGroup;

  private heroIntervalId?: number;

  constructor(
    private readonly fb: FormBuilder,
    private readonly notificationService: NotificationService,
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

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  scrollToSection(sectionId: string): void {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.mobileMenuOpen = false;
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

interface ProductCard {
  name: string;
  price: string;
  image: string;
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
