import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-complete-profile',
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss']
})
export class CompleteProfileComponent implements OnInit {
  form: FormGroup;
  loading = false;
  loadingProfile = true;
  private birthDate = '';
  private gender = 'Prefiro nao informar';

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, this.cpfValidator]],
      phone: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.patchUser(this.authService.getCurrentUser());
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.loadingProfile = false;
        this.patchUser(profile);
        if (this.authService.isProfileComplete()) {
          this.navigateToReturnUrl();
        }
      },
      error: () => {
        this.loadingProfile = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.updateProfile({
      name: String(this.form.get('name')?.value || '').trim(),
      cpf: String(this.form.get('cpf')?.value || '').replace(/\D/g, ''),
      phone: String(this.form.get('phone')?.value || '').trim(),
      birth_date: this.birthDate,
      gender: this.gender
    }).subscribe({
      next: () => {
        this.loading = false;
        if (!this.authService.isProfileComplete()) {
          this.notificationService.openSnackBar('Ainda faltam dados obrigatorios no cadastro.');
          return;
        }
        this.notificationService.openSnackBar('Cadastro completado com sucesso.');
        this.navigateToReturnUrl();
      },
      error: (message) => {
        this.loading = false;
        this.notificationService.openSnackBar(
          typeof message === 'string' ? message : 'Nao foi possivel completar o cadastro.'
        );
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

  cpfValidator(control: AbstractControl): ValidationErrors | null {
    const cpf = String(control.value || '').replace(/\D/g, '');
    if (!cpf) {
      return null;
    }
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      return { cpfInvalid: true };
    }

    let sum = 0;
    for (let index = 0; index < 9; index += 1) {
      sum += Number(cpf.charAt(index)) * (10 - index);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) {
      digit = 0;
    }
    if (digit !== Number(cpf.charAt(9))) {
      return { cpfInvalid: true };
    }

    sum = 0;
    for (let index = 0; index < 10; index += 1) {
      sum += Number(cpf.charAt(index)) * (11 - index);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) {
      digit = 0;
    }
    return digit === Number(cpf.charAt(10)) ? null : { cpfInvalid: true };
  }

  private patchUser(user: any): void {
    if (!user) {
      return;
    }
    this.form.patchValue({
      name: user.name || user.fullName || '',
      email: user.email || '',
      cpf: user.cpf || '',
      phone: user.phone || ''
    });
    this.birthDate = user.birth_date || this.birthDate;
    this.gender = user.gender || this.gender;
  }

  private navigateToReturnUrl(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const safeReturnUrl = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/minha-conta';
    this.router.navigateByUrl(safeReturnUrl);
  }
}
