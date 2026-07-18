import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthenticationService } from '../../../core/services/auth.service';
import { AdminCreditUser, CreditColoreService } from '../../../core/services/credit-colore.service';

@Component({ selector: 'app-admin-users', templateUrl: './admin-users.component.html', styleUrls: ['./admin-users.component.scss'] })
export class AdminUsersComponent implements OnInit {
  users: AdminCreditUser[] = [];
  filters: Record<string, string> = {};
  creditAmounts: Record<string, number> = {};
  resettingPasswords: Record<string, boolean> = {};
  loading = false;
  constructor(
    private creditService: CreditColoreService,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void { this.loadUsers(); }
  loadUsers(): void {
    this.loading = true;
    this.creditService.getUsers(this.filters).pipe(finalize(() => this.loading = false)).subscribe({
      next: users => this.users = users,
      error: () => this.snackBar.open('Nao foi possivel carregar os usuarios.', 'Fechar', { duration: 4000 })
    });
  }
  clearFilters(): void { this.filters = {}; this.loadUsers(); }
  addCredit(user: AdminCreditUser): void {
    const amount = Number(this.creditAmounts[user.id] || 0);
    if (amount <= 0) return;
    this.creditService.addCredit(user.id, amount).subscribe({
      next: credit => { user.credit = credit; this.creditAmounts[user.id] = 0; },
      error: () => this.snackBar.open('Nao foi possivel adicionar credito.', 'Fechar', { duration: 4000 })
    });
  }
  resetPassword(user: AdminCreditUser): void {
    if (this.resettingPasswords[user.id]) return;
    this.resettingPasswords[user.id] = true;
    this.authService.adminPasswordReset(user.id).pipe(finalize(() => this.resettingPasswords[user.id] = false)).subscribe({
      next: () => this.snackBar.open(`Email de reset enviado para ${user.email}.`, 'Fechar', { duration: 5000 }),
      error: (error) => this.snackBar.open(error || 'Nao foi possivel enviar o reset de senha.', 'Fechar', { duration: 5000 })
    });
  }
}
