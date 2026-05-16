import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

import { AuthenticationService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-creat-user',
  templateUrl: './new-user.component.html',
  styleUrls: ['./new-user.component.scss'],
})
export class NewUserComponent implements OnInit {
  form!: FormGroup;
  private formSubmitAttempt = false;
  horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  verticalPosition: MatSnackBarVerticalPosition = 'top';

  loading = false;
  submitted = false;
  error = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      userName: ['', Validators.required],
      userEmail: ['', [Validators.required, Validators.email]],
      userLatitude: ['00'],
      userLogitude: ['00'],
      userOffshoot: ['Cao'],
      userCpf: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    this.formSubmitAttempt = true;
    this.submitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.password !== this.form.value.passwordConfirm) {
      this.openSnackBar('As senhas sao diferentes.');
      return;
    }

    this.loading = true;

    this.authService
      .registerAndAuthenticate({
        email: (this.form.value.userEmail || '').toLowerCase(),
        name: this.form.value.userName,
        password: this.form.value.password,
        cpf: this.form.value.userCpf,
        offshoot: this.form.value.userOffshoot || 'Cao',
        longitude: this.form.value.userLogitude || '00',
        latitude: this.form.value.userLatitude || '00'
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.openSnackBar('Conta criada com sucesso.');
          this.router.navigate(['/minha-conta']);
        },
        error: (errorMessage) => {
          this.loading = false;
          const message =
            typeof errorMessage === 'string'
              ? errorMessage
              : 'Nao foi possivel criar sua conta.';
          this.openSnackBar(message);
        },
      });
  }

  isFieldInvalid(field: string): boolean {
    return (
      (!this.form.get(field)?.valid && this.form.get(field)?.touched) ||
      (!this.form.get(field)?.touched && this.formSubmitAttempt)
    );
  }

  openSnackBar(message: string): void {
    this.snackBar.open(message, 'Ok', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
    });
  }
}
