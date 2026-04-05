import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  active?: boolean;
}

@Component({
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.scss']
})
export class UserSidebarComponent {
  @Input() activeRoute: string = '';

  menuItems: MenuItem[] = [
    { label: 'Minha Conta', route: '/minha-conta', icon: 'account_circle' },
    { label: 'Meus Pedidos', route: '/minha-conta/meus-pedidos', icon: 'shopping_bag' },
    { label: 'Meus Dados', route: '/minha-conta/meus-dados', icon: 'person' },
    { label: 'Meus Endereços', route: '/minha-conta/meus-enderecos', icon: 'location_on' },
    { label: 'Meus Cartões', route: '/minha-conta/meus-cartoes', icon: 'credit_card' },
    { label: 'Comprar Novamente', route: '/minha-conta/comprar-novamente', icon: 'refresh' },
    { label: 'Meus Favoritos', route: '/minha-conta/favoritos', icon: 'favorite' },
    { label: 'Minhas Avaliações', route: '/minha-conta/avaliacoes', icon: 'star' },
    { label: 'Minhas Notificações', route: '/minha-conta/notificacoes', icon: 'notifications' },
    { label: 'Suporte', route: '/minha-conta/suporte', icon: 'help' }
  ];

  constructor(private router: Router, private authService: AuthenticationService) {}

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}