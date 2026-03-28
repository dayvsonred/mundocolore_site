import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { Title } from '@angular/platform-browser';
import { NotificationService } from 'src/app/core/services/notification.service';
import { GlobalService } from 'src/app/core/services/global.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/shared/confirm-dialog/confirm-dialog.component';
import { stat } from 'fs';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-donation-list',
  templateUrl: './donation-list.component.html',
  styleUrls: ['./donation-list.component.css']
})

export class DonationListComponent implements OnInit {
  @ViewChild(MatSort, { static: true })
  sort: MatSort = new MatSort;

  displayedColumns: string[] = [
    'name',
    'valor',
    'date_create',
    'active',
    //'dell',
    'valor_disponivel',
    'valor_tranferido',
    'encerrar',
    'solicitar_pagamento',
    'status',
    'deletar'
  ];
  dataSource = new MatTableDataSource<any>([]);
  page = 1;
  limit = 10;
  hasNextPage = false;
  total = 0;
  conta_nivel_data_nivel = "BASICO"

  //conta_nivel_data_nivel : "BASICO"

  constructor(
    //private logger: NGXLogger,
    private notificationService: NotificationService,
    private titleService: Title,
    private globalService: GlobalService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    let user = this.globalService.getCurrentUser();
    console.log("aasdasd aqui porrrr->>>>> " + user);
    console.log(user);
    this.conta_nivel_data_nivel = user.conta_nivel_data_nivel;
    console.log(this.conta_nivel_data_nivel);
    this.titleService.setTitle(APP_NAME);
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
          console.log('Doações recebidas:', response);
        },
        error: (error) => {
          console.error('Erro ao buscar doações:', error);
        }
      });
  }

  navigateToView(id: string) {
    this.router.navigate(['donation/view', id]); // ou ['donation/view', id] dependendo da sua estrutura
  }

  encerrarCampanha(donation: any): void {
    console.log(donation)

    if (!donation?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmar Encerrar Campanha',
        message: `✅ A campanha não será mais visível publicamente (apenas você poderá visualizá-la).
        ✅ Após o encerramento, solicite o resgate das doações.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.globalService.donationClosed(donation.id).subscribe({
          next: () => {
            this.notificationService.openSnackBar('Doação Encerrada com sucesso!');
            this.buscarDoacoes(); // ou this.ngOnInit()
          },
          error: (err) => {
            this.notificationService.openSnackBar(err || 'Erro ao Encerrada a doação.');
          }
        });
      }
    });
  }

  solicitarPagamento(donation: any): void {
    console.log('Solicitar pagamento para:', donation.id);
    console.log(donation);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Iniciar Recebimento',
        message: 'Ao iniciar o processo de resgate da doação, o sistema transferirá automaticamente o valor para os dados bancários cadastrados na conta do usuário. Em instantes o valor será transferido. os comprovantes de pagamentos seram enviados por e-mail.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.globalService.solicitarPagamento(donation.id).subscribe({
          next: () => {
            this.notificationService.openSnackBar('Pagamento solicitado com sucesso!');
            this.buscarDoacoes(); // atualiza a listagem
          },
          error: (err) => {
            this.notificationService.openSnackBar(err);
          }
        });
      }
    });



  }

  deletarCampanha(donation: any): void {
    console.log('Deletar campanha:', donation.id);

    if (!donation?.id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      id: 'modal_deletarCampanha_1234999',
      panelClass: 'modal_deletarCampanha_9',
      data: {
        title: 'Confirmar Exclusão',
        message: 'Ao deletar uma doação, você perderá acesso aos dados dela. Caso precise de mais informações, entre em contato com os administradores.'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.globalService.deleteDonationById(donation.id).subscribe({
          next: () => {
            this.notificationService.openSnackBar('Doação deletada com sucesso!');
            this.buscarDoacoes(); // ou this.ngOnInit()
          },
          error: (err) => {
            this.notificationService.openSnackBar(err || 'Erro ao deletar a doação.');
          }
        });
      }
    });
  }

  paymentStatus(status: string) {
    let val = "A SOLICITAR";

    if (status == "START") {
      val = "A SOLICITAR";
    }

    if (status == "PROCESS") {
      val = "PROCESSANDO PAGAMENTO";
    }

    if (status == "END") {
      val = "PAGO";
    }

    return val;
  }

}


