import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { GlobalService } from 'src/app/core/services/global.service';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  //displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  //dataSource = new MatTableDataSource(ELEMENT_DATA);

  @ViewChild(MatSort, { static: true })
  //@ViewChild(MatSort) sort!: MatSort;
  sort: MatSort = new MatSort;

  displayedColumns: string[] = ['name', 'area', 'valor', 'date_create', 'active', 'dell'];
  dataSource = new MatTableDataSource<any>([]);
  page = 1;
  limit = 10;
  hasNextPage = false;
  total = 0;

  constructor(
    //private logger: NGXLogger,
    private notificationService: NotificationService,
    private titleService: Title,
    private globalService: GlobalService
  ) { }

  ngOnInit() {
    this.titleService.setTitle(APP_NAME);
    //this.logger.log('Customers loaded');
    this.notificationService.openSnackBar('Customers loaded');
    this.dataSource.sort = this.sort;
    this.buscarDoacoes();

  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  buscarDoacoes(): void {
    this.globalService.getDonationList(this.page, this.limit)
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.items;
          this.hasNextPage = response.has_next_page;
          this.total = response.total;
          console.log('Doações recebidas:', response.items);
        },
        error: (error) => {
          console.error('Erro ao buscar doações:', error);
        }
      });
  }

}


