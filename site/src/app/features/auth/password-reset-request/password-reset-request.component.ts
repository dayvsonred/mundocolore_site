import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';

import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/shared/confirm-dialog/confirm-dialog.component';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-password-reset-request',
  templateUrl: './password-reset-request.component.html',
  styleUrls: ['./password-reset-request.component.css']
})
export class PasswordResetRequestComponent implements OnInit {

  private email!: string;
  form!: UntypedFormGroup;
  loading!: boolean;

  constructor(private authService: AuthenticationService,
    private notificationService: NotificationService,
    private titleService: Title,
    private router: Router,
    private dialog: MatDialog) { }

  ngOnInit() {
    this.titleService.setTitle(APP_NAME);

    this.form = new UntypedFormGroup({
      email: new UntypedFormControl('', [Validators.required, Validators.email])
    });

    this.form.get('email')?.valueChanges
      .subscribe((val: string) => { this.email = val.toLowerCase(); });
  }

  resetPassword() {
    this.loading = true;
    this.authService.passwordResetRequest(this.email)
      .subscribe(
        response => {
          this.loading = false;
          const dialogData = new ConfirmDialogModel(
            'Recuperação de senha',
            response?.message || 'Link de recuperação enviado.',
            true
          );
          const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            maxWidth: '400px',
            data: dialogData
          });
          dialogRef.afterClosed().subscribe((confirmed: boolean) => {
            if (confirmed) {
              this.router.navigate(['/auth/login']);
            }
          });
        },
        error => {
          this.loading = false;
          this.notificationService.openSnackBar(error?.error || error);
        }
      );
  }

  cancel() {
    this.router.navigate(['/']);
  }
}



