import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

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
    email: '',
    email_confirmed: false
  };
  resendingConfirmation = false;

  recentOrders: RecentOrder[] = [];
  defaultAddress = 'Rua das Flores, 123 - Sao Paulo/SP';
  billingAddress = 'Av. Paulista, 456 - Sao Paulo/SP';

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        name: currentUser.fullName || currentUser.name || 'Usuario',
        email: currentUser.email || '',
        email_confirmed: !!currentUser.email_confirmed
      };
    }
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = {
          name: profile?.name || this.user.name,
          email: profile?.email || this.user.email,
          email_confirmed: !!profile?.email_confirmed
        };
      },
      error: () => {}
    });
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

  viewAllOrders(): void {
    this.router.navigate(['/minha-conta/meus-pedidos']);
  }

  editProfile(): void {
    this.router.navigate(['/minha-conta/meus-dados']);
  }

  changePassword(): void {
    this.router.navigate(['/minha-conta/alterar-senha']);
  }

  resendEmailConfirmation(): void {
    if (this.user.email_confirmed || this.resendingConfirmation) {
      return;
    }

    this.resendingConfirmation = true;
    this.authService.resendEmailConfirmation().subscribe({
      next: () => {
        this.resendingConfirmation = false;
        this.notificationService.openSnackBar('Email de confirmacao enviado.');
      },
      error: (error) => {
        this.resendingConfirmation = false;
        this.notificationService.openSnackBar(error || 'Nao foi possivel reenviar o email.');
      }
    });
  }

  manageAddresses(): void {
    this.router.navigate(['/minha-conta/meus-enderecos']);
  }
}
