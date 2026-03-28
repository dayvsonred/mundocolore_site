import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-donation-view',
  templateUrl: './donation-view.component.html',
  styleUrls: ['./donation-view.component.css']
})
export class DonationViewComponent implements OnInit {
  //displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  //dataSource = new MatTableDataSource(ELEMENT_DATA);
  donation: any = null;

  constructor(
    //private logger: NGXLogger,
    private notificationService: NotificationService,
    private titleService: Title,
    private globalService: GlobalService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.titleService.setTitle(APP_NAME);
    const nomeLink = this.route.snapshot.paramMap.get('id');

    console.log("nomeLink .............")
    console.log(this.route.snapshot.paramMap)
    if (nomeLink) {
      this.fetchDonation(nomeLink);
    }
  }

fetchDonation(nomeLink: string): void {
    this.globalService.getDonationByLink(nomeLink)
      .subscribe({
        next: (response) => {
          this.donation = response;
          console.log('Doação recebida:', this.donation);
        },
        error: (error) => {
          console.error('Erro ao buscar doação:', error);
        }
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

}


