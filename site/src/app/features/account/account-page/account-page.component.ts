import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from 'src/app/core/services/auth.service';

interface RecentOrder {
  id: string;
  date: string;
  total: number;
  status: string;
}

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPageComponent implements OnInit {
  user = {
    name: 'Usuario',
    email: ''
  };

  recentOrders: RecentOrder[] = [];
  defaultAddress = 'Rua das Flores, 123 - Sao Paulo/SP';
  billingAddress = 'Av. Paulista, 456 - Sao Paulo/SP';

  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        name: currentUser.fullName || currentUser.name || 'Usuario',
        email: currentUser.email || ''
      };
    }
    this.loadMockData();
  }

  loadMockData(): void {
    this.recentOrders = [
      {
        id: 'PED-001',
        date: '2024-01-15',
        total: 299.9,
        status: 'Entregue'
      },
      {
        id: 'PED-002',
        date: '2024-01-10',
        total: 149.5,
        status: 'Entregue'
      }
    ];
  }

  viewOrder(_order: RecentOrder): void {
    this.router.navigate(['/minha-conta/meus-pedidos']);
  }

  reorder(): void {
    this.router.navigate(['/catalog']);
  }

  editProfile(): void {
    this.router.navigate(['/minha-conta/meus-dados']);
  }

  changePassword(): void {
    console.log('Change password');
  }

  manageAddresses(): void {
    this.router.navigate(['/minha-conta/meus-enderecos']);
  }
}
