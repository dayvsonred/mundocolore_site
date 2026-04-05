import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
    name: 'João Silva',
    email: 'joao.silva@email.com'
  };

  recentOrders: RecentOrder[] = [];
  defaultAddress = 'Rua das Flores, 123 - São Paulo/SP';
  billingAddress = 'Av. Paulista, 456 - São Paulo/SP';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.recentOrders = [
      {
        id: 'PED-001',
        date: '2024-01-15',
        total: 299.90,
        status: 'Entregue'
      },
      {
        id: 'PED-002',
        date: '2024-01-10',
        total: 149.50,
        status: 'Entregue'
      }
    ];
  }

  viewOrder(order: RecentOrder) {
    this.router.navigate(['/minha-conta/meus-pedidos']);
  }

  reorder() {
    this.router.navigate(['/catalog']);
  }

  editProfile() {
    this.router.navigate(['/minha-conta/meus-dados']);
  }

  changePassword() {
    // TODO: Navigate to change password
    console.log('Change password');
  }

  manageAddresses() {
    this.router.navigate(['/minha-conta/meus-enderecos']);
  }
}


