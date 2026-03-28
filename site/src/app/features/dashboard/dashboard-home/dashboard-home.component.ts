import { Component, OnInit } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Title } from '@angular/platform-browser';
//import { NGXLogger } from 'ngx-logger';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from 'src/environments/environment';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  currentUser: any;

    donations: any[] = [];
    page = 1;
    limit = 10;
    hasNextPage = false;
    total = 0;


  constructor(private notificationService: NotificationService,
    private authService: AuthenticationService,
    private titleService: Title,
    private snackBar: MatSnackBar,
    private globalService: GlobalService
    //private logger: NGXLogger
  ) {
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.titleService.setTitle(APP_NAME + ' - Dashboard');
    //this.logger.log('Dashboard loaded');

    this.buscarDoacoes();

    setTimeout(() => {
      this.notificationService.openSnackBar('Welcome!');
    });
  }

  getImageUrl(imagePath: string): string {
    return imagePath;
    return `https://adimax.com.br/wp-content/uploads/2022/10/como-adaptar-cachorro-e-crianca.jpg`;
    if (imagePath.startsWith('http')) {
      return imagePath; // URL completa
    }
    return `${environment.urlBase}/images/${imagePath}`; // Caminho relativo
  }

  buscarDoacoes(): void {
    this.globalService.getDonationList(this.page, this.limit)
      .subscribe({
        next: (response) => {
          this.donations = [...this.donations, ...response.items]; // Concatena novas doações
          this.hasNextPage = response.has_next_page;
          this.total = response.total;
          console.log('Doações recebidas:', this.donations);
        },
        error: (error) => {
          console.error('Erro ao buscar doações:', error);
        }
      });
  }
}


