import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { AdminCreditInstallment, CreditColoreService } from 'src/app/core/services/credit-colore.service';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-order-payments',
  templateUrl: './admin-order-payments.component.html',
  styleUrls: ['./admin-order-payments.component.scss']
})
export class AdminOrderPaymentsComponent implements OnInit {
  installments: AdminCreditInstallment[] = [];
  filters: Record<string, string> = { status: 'a_pagar' };
  loading = false;
  paying: Record<string, boolean> = {};
  page = 1;
  pageSize = 15;

  constructor(
    private creditService: CreditColoreService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadInstallments();
  }

  loadInstallments(): void {
    this.loading = true;
    this.creditService.getAdminInstallments(this.filters).pipe(finalize(() => this.loading = false)).subscribe({
      next: (installments) => {
        this.installments = installments.sort((a, b) =>
          `${a.due_date}-${a.user_name}-${a.order_id}-${a.number}`.localeCompare(`${b.due_date}-${b.user_name}-${b.order_id}-${b.number}`)
        );
        this.page = 1;
      },
      error: () => this.snackBar.open('Nao foi possivel carregar as parcelas.', 'Fechar', { duration: 4000 })
    });
  }

  clearFilters(): void {
    this.filters = { status: 'a_pagar' };
    this.loadInstallments();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.installments.length / this.pageSize));
  }

  get pagedInstallments(): AdminCreditInstallment[] {
    const start = (this.page - 1) * this.pageSize;
    return this.installments.slice(start, start + this.pageSize);
  }

  previousPage(): void {
    this.page = Math.max(1, this.page - 1);
  }

  nextPage(): void {
    this.page = Math.min(this.totalPages, this.page + 1);
  }

  markAsPaid(installment: AdminCreditInstallment): void {
    if (this.statusLabel(installment.status) === 'Paga' || this.paying[installment.id]) {
      return;
    }

    const dialogData = new ConfirmDialogModel(
      'Confirmar pagamento',
      `Deseja marcar a parcela ${installment.number}/${installment.total} do pedido ${installment.order_id} como paga?`
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: dialogData });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.paying[installment.id] = true;
      this.creditService.payInstallment(installment.id, installment.amount).pipe(finalize(() => this.paying[installment.id] = false)).subscribe({
        next: () => {
          this.snackBar.open('Parcela marcada como paga.', 'Fechar', { duration: 3000 });
          this.loadInstallments();
        },
        error: () => this.snackBar.open('Nao foi possivel atualizar a parcela.', 'Fechar', { duration: 4000 })
      });
    });
  }

  statusLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'paga' || normalized === 'paid') {
      return 'Paga';
    }
    return 'A pagar';
  }
}
