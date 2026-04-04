import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  readonly logoPath = 'assets/images/logo-mundo-colore.jpg';
  readonly brandName = 'Mundo Colore';

  mobileMenuOpen = false;
  isNavbarSolid = false;
  cartItemCount = 0;

  readonly menuItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'collections', label: 'Colecoes' },
    { id: 'arrivals', label: 'Novidades' },
    { id: 'promotions', label: 'Promocoes' },
    { id: 'contact', label: 'Contato' }
  ];

  constructor(
    private router: Router,
    private cartService: CartService
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
}
