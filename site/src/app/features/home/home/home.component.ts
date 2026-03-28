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
    { id: 'home', label: 'Home' },
    { id: 'collections', label: 'Collections' },
    { id: 'arrivals', label: 'New Arrivals' },
    { id: 'promotions', label: 'Promotions' },
    { id: 'contact', label: 'Contact' }
  ];

  readonly heroSlides: ReadonlyArray<HeroSlide> = [
    {
      title: 'Color, comfort and joy for every childhood moment',
      subtitle: 'A playful launch collection with soft fabrics and rainbow inspired essentials.',
      cta: 'Shop New Arrivals',
      backgroundImage:
        'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Pastel tones and happy outfits for everyday adventures',
      subtitle: 'Designed for movement, made for smiles, ready for school and weekend fun.',
      cta: 'Explore Collections',
      backgroundImage:
        'https://images.unsplash.com/photo-1542838687-8f3d93d6f105?auto=format&fit=crop&w=1600&q=80'
    },
    {
      title: 'Mundo Colore Store is now live',
      subtitle: 'Discover modern kidswear with rounded details and a gentle colorful identity.',
      cta: 'View Promotions',
      backgroundImage:
        'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=1600&q=80'
    }
  ];

  readonly featuredCards: ReadonlyArray<FeaturedCard> = [
    {
      title: 'New Arrivals',
      description: 'Fresh drops for babies and kids with breathable cotton and pastel finishes.',
      badgeColor: 'var(--primary-red)'
    },
    {
      title: 'Color Collection',
      description: 'Rainbow inspired looks curated by color mood and playful combinations.',
      badgeColor: 'var(--primary-blue)'
    },
    {
      title: 'Sales',
      description: 'Special prices for selected looks, bundles and seasonal combos.',
      badgeColor: 'var(--primary-orange)'
    }
  ];

  readonly products: ReadonlyArray<ProductCard> = [
    { name: 'Rainbow Hoodie Set', price: 'R$ 149,90', image: 'https://images.unsplash.com/photo-1618375531912-867984bdfd87?auto=format&fit=crop&w=800&q=80' },
    { name: 'Soft Garden Dress', price: 'R$ 129,90', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80' },
    { name: 'Sunny Day Shorts', price: 'R$ 79,90', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80' },
    { name: 'Cloud Pajama Duo', price: 'R$ 99,90', image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80' },
    { name: 'Little Explorer Jacket', price: 'R$ 169,90', image: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=800&q=80' },
    { name: 'Candy Knit Set', price: 'R$ 139,90', image: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80' },
    { name: 'Playtime Tee Pack', price: 'R$ 89,90', image: 'https://images.unsplash.com/photo-1620799139652-715e4d5b232d?auto=format&fit=crop&w=800&q=80' },
    { name: 'Mini Rainbow Overalls', price: 'R$ 119,90', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80' }
  ];

  readonly benefits: ReadonlyArray<BenefitItem> = [
    { icon: 'local_shipping', title: 'Fast Shipping', text: 'Dispatch in up to 24h for selected regions.' },
    { icon: 'verified', title: 'Premium Quality', text: 'Safe, soft and durable materials for daily use.' },
    { icon: 'eco', title: 'Eco Friendly', text: 'Responsible production and low impact packaging.' }
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
    { label: 'Home', sectionId: 'home' },
    { label: 'Collections', sectionId: 'collections' },
    { label: 'New Arrivals', sectionId: 'arrivals' },
    { label: 'Contact', sectionId: 'contact' }
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
