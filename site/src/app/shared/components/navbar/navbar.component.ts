import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { AuthenticationService } from '../../../core/services/auth.service';
import { APP_NAME } from '../../../core/constants/branding';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  readonly logoPath = 'assets/images/logo-mundo-colore.jpg';
  readonly brandName = APP_NAME;

  mobileMenuOpen = false;
  isNavbarSolid = false;
  cartItemCount = 0;

  readonly menuItems = [
    { id: 'collections', label: 'Coleções', route: '/colecoes' },
    { id: 'promotions', label: 'Promoções', route: '/promocoes' },
    { id: 'contact', label: 'Contato', route: '/contato' }
  ];

  constructor(
    private router: Router,
    private cartService: CartService,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isNavbarSolid = window.scrollY > 24;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
    this.closeMobileMenu();
  }

  navigateToCatalog(): void {
    this.router.navigate(['/catalog']);
    this.closeMobileMenu();
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
    this.closeMobileMenu();
  }

  navigateToMyAccount(): void {
    const route = this.authService.isAuthenticated() ? '/minha-conta' : '/auth/login';
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  navigateToMenuItem(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }
}
