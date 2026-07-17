import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import {
  ColoreCard,
  CreditColore,
  CreditColoreService,
  CreditHistory,
  CreditInstallment
} from 'src/app/core/services/credit-colore.service';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit {
  credit: CreditColore | null = null;
  card: ColoreCard | null = null;
  installments: CreditInstallment[] = [];
  history: CreditHistory[] = [];
  loading = false;
  installmentStatusFilter = 'a_pagar';
  installmentPage = 1;
  readonly installmentPageSize = 15;
  statusSortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private creditService: CreditColoreService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCreditCard();
  }

  loadCreditCard(): void {
    this.loading = true;
    this.creditService.getCredit().pipe(finalize(() => this.loading = false)).subscribe({
      next: (credit) => {
        this.credit = credit;
        this.card = credit.card || null;
        this.installments = [...(credit.installments || [])].sort((a, b) =>
          `${a.due_date}-${a.order_id}-${a.number}`.localeCompare(`${b.due_date}-${b.order_id}-${b.number}`)
        );
        this.installmentPage = 1;
        this.history = [...(credit.history || [])].sort((a, b) =>
          (b.created_at || '').localeCompare(a.created_at || '')
        );
      },
      error: () => {
        this.snackBar.open('Nao foi possivel carregar o cartao Colore.', 'Fechar', { duration: 4000 });
      }
    });
  }

  formatCardNumber(number: string): string {
    return (number || '').replace(/(.{4})/g, '$1 ').trim();
  }

  statusLabel(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'paga':
      case 'paid':
        return 'Paga';
      case 'a_pagar':
      default:
        return 'A pagar';
    }
  }

  get filteredInstallments(): CreditInstallment[] {
    const normalizedFilter = this.normalizeStatus(this.installmentStatusFilter);
    const filtered = this.installments.filter((installment) => {
      if (normalizedFilter === 'todas') {
        return true;
      }
      return this.normalizeStatus(installment.status) === normalizedFilter;
    });

    return [...filtered].sort((a, b) => {
      const statusCompare = this.statusLabel(a.status).localeCompare(this.statusLabel(b.status));
      if (statusCompare !== 0) {
        return this.statusSortDirection === 'asc' ? statusCompare : -statusCompare;
      }
      return `${a.due_date}-${a.order_id}-${a.number}`.localeCompare(`${b.due_date}-${b.order_id}-${b.number}`);
    });
  }

  get pagedInstallments(): CreditInstallment[] {
    const start = (this.installmentPage - 1) * this.installmentPageSize;
    return this.filteredInstallments.slice(start, start + this.installmentPageSize);
  }

  get installmentTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredInstallments.length / this.installmentPageSize));
  }

  get installmentPageStart(): number {
    if (!this.filteredInstallments.length) return 0;
    return (this.installmentPage - 1) * this.installmentPageSize + 1;
  }

  get installmentPageEnd(): number {
    return Math.min(this.installmentPage * this.installmentPageSize, this.filteredInstallments.length);
  }

  onInstallmentStatusFilterChange(): void {
    this.installmentPage = 1;
  }

  sortByStatus(): void {
    this.statusSortDirection = this.statusSortDirection === 'asc' ? 'desc' : 'asc';
    this.installmentPage = 1;
  }

  previousInstallmentPage(): void {
    this.installmentPage = Math.max(1, this.installmentPage - 1);
  }

  nextInstallmentPage(): void {
    this.installmentPage = Math.min(this.installmentTotalPages, this.installmentPage + 1);
  }

  private normalizeStatus(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'paga' || normalized === 'paid') {
      return 'paga';
    }
    if (normalized === 'todas') {
      return 'todas';
    }
    return 'a_pagar';
  }

  historyLabel(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'admin_credit_added':
        return 'Credito adicionado';
      default:
        return type || 'Movimentacao';
    }
  }
}
