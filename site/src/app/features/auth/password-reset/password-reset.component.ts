import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent implements OnInit {

  private token!: string;
  email!: string;
  form!: UntypedFormGroup;
  loading!: boolean;
  hideNewPassword: boolean;
  hideNewPasswordConfirm: boolean;

  constructor(private activeRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private titleService: Title) {

    this.titleService.setTitle(APP_NAME);
    this.hideNewPassword = true;
    this.hideNewPasswordConfirm = true;
  }

  ngOnInit() {
    this.activeRoute.queryParamMap.subscribe((params: ParamMap) => {
      const t = params.get('token');
      const e = params.get('email');

      this.token = t ? t : '';
      this.email = e ? e : '';

      if (!this.token || !this.email || !this.token.trim() || !this.email.trim()) {
        this.router.navigate(['/']);
      }
    });

    this.form = new UntypedFormGroup({
      newPassword: new UntypedFormControl('', Validators.required),
      newPasswordConfirm: new UntypedFormControl('', Validators.required)
    });
  }

  resetPassword() {

    const password = this.form.get('newPassword')?.value;
    const passwordConfirm = this.form.get('newPasswordConfirm')?.value;

    if (password !== passwordConfirm) {
      this.notificationService.openSnackBar('As senhas não conferem');
      return;
    }

    this.loading = true;

    this.authService.passwordReset(this.email, this.token, password, passwordConfirm)
      .subscribe(
        () => {
          this.notificationService.openSnackBar('Senha alterada com sucesso.');
          this.router.navigate(['/auth/login']);
        },
        (error: any) => {
          const msg = error?.error || error?.message || 'Erro ao alterar a senha.';
          this.notificationService.openSnackBar(msg);
          this.loading = false;
        }
      );
  }

  cancel() {
    this.router.navigate(['/']);
  }
}


