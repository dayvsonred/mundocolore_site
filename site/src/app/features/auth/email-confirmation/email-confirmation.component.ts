import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-email-confirmation',
  templateUrl: './email-confirmation.component.html',
  styleUrls: ['./email-confirmation.component.scss']
})
export class EmailConfirmationComponent implements OnInit {
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const email = params.get('email')?.trim() || '';
      const token = params.get('token')?.trim() || '';

      if (!email || !token) {
        this.loading = false;
        this.showErrorAndGoHome();
        return;
      }

      this.authService.confirmEmail(email, token).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Sucesso ao validar email. ✅', '', { duration: 500 });
          setTimeout(() => this.router.navigate(['home']), 500);
        },
        error: () => {
          this.loading = false;
          this.showErrorAndGoHome();
        }
      });
    });
  }

  private showErrorAndGoHome(): void {
    const dialogData = new ConfirmDialogModel(
      'Erro',
      'Erro ao validar email. Entre em contato com administradores.',
      true
    );

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['home']);
    });
  }
}
