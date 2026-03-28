import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormControl, Validators, UntypedFormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { AuthenticationService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { environment } from '../../../../environments/environment';


import { APP_NAME } from 'src/app/core/constants/branding';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

    loginForm!: UntypedFormGroup;
    loading!: boolean;
    titulo: any;
    

    constructor(private router: Router,
        private titleService: Title,
        private notificationService: NotificationService,
        private authenticationService: AuthenticationService) {
    }

    ngOnInit() {
        localStorage.removeItem('access_token');
		localStorage.removeItem('token');
        localStorage.removeItem('savedUserEmail');
        this.titleService.setTitle(APP_NAME);
        this.authenticationService.logout();
        this.createForm();
        this.titulo = environment.nomeProjetoTitulo;
    }

    private createForm() {
        const savedUserEmail = localStorage.getItem('savedUserEmail');

        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(savedUserEmail, [Validators.required, Validators.email]),
            password: new UntypedFormControl('', Validators.required),
            rememberMe: new UntypedFormControl(savedUserEmail !== null),
            acceptTerms: new UntypedFormControl(true)
        });
    }

    login() {
        const email = this.loginForm.get('email')?.value;
        const password = this.loginForm.get('password')?.value;
        const rememberMe = this.loginForm.get('rememberMe')?.value;

        this.loading = true;
        this.authenticationService
            .sign({ email: email.toLowerCase(), password: password })
            .subscribe({
                next: (res) => {
                    console.log(" login 0098080808");
                    console.log(res);
                    if (rememberMe) {
                        localStorage.setItem('savedUserEmail', email);
                    } else {
                        localStorage.removeItem('savedUserEmail');
                    }
                    this.router.navigate(['/dashboard']);
                },
                error: (e) => {
                    this.notificationService.openSnackBar(e);
                    this.loading = false;
                },
            })
    }

    oldLogin() {
        const email = this.loginForm.get('email')?.value;
        const password = this.loginForm.get('password')?.value;
        const rememberMe = this.loginForm.get('rememberMe')?.value;

        this.loading = true;
        this.authenticationService
            .login(email.toLowerCase(), password)
            .subscribe(
                data => {
                    if (rememberMe) {
                        localStorage.setItem('savedUserEmail', email);
                    } else {
                        localStorage.removeItem('savedUserEmail');
                    }
                    this.router.navigate(['/']);
                },
                error => {
                    this.notificationService.openSnackBar(error.error);
                    this.loading = false;
                }
            );
    }

    resetPassword() {
        this.router.navigate(['/auth/password-reset-request']);
    }

    createUser() {
        if (!this.loginForm.get('acceptTerms')?.value) {
            this.notificationService.openSnackBar('Você precisa aceitar os termos da plataforma para criar conta.');
            return;
        }
        this.router.navigate(['/auth/new-user']);
    }
}


