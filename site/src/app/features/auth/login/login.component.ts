import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

    loginForm!: UntypedFormGroup;
    loading!: boolean;
    titulo: any;
    googleConfigured = !!environment.googleClientId;

    @ViewChild('googleButton') googleButton?: ElementRef<HTMLDivElement>;

    private googleLoadTimer?: ReturnType<typeof setTimeout>;

    constructor(private router: Router,
        private titleService: Title,
        private notificationService: NotificationService,
        private authenticationService: AuthenticationService,
        private ngZone: NgZone) {
    }

    ngOnInit() {
        this.titleService.setTitle(APP_NAME);
        if (this.authenticationService.isAuthenticated()) {
            this.navigateAfterAuthentication();
            return;
        }
        this.createForm();
        this.titulo = environment.nomeProjetoTitulo;
    }

    ngAfterViewInit(): void {
        this.initializeGoogleButton();
    }

    ngOnDestroy(): void {
        if (this.googleLoadTimer) {
            clearTimeout(this.googleLoadTimer);
        }
        window.google?.accounts.id.cancel();
    }

    private createForm() {
        const savedUserEmail = localStorage.getItem('savedUserEmail');

        this.loginForm = new UntypedFormGroup({
            email: new UntypedFormControl(savedUserEmail, [Validators.required, Validators.email]),
            password: new UntypedFormControl('', Validators.required),
            rememberMe: new UntypedFormControl(savedUserEmail !== null),
            acceptTerms: new UntypedFormControl(false)
        });
    }

    login() {
        const email = this.loginForm.get('email')?.value;
        const password = this.loginForm.get('password')?.value;
        const rememberMe = this.loginForm.get('rememberMe')?.value;

        this.loading = true;
        this.authenticationService
            .login(email.toLowerCase(), password)
            .subscribe({
                next: () => {
                    if (rememberMe) {
                        localStorage.setItem('savedUserEmail', email);
                    } else {
                        localStorage.removeItem('savedUserEmail');
                    }
                    this.navigateAfterAuthentication();
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

    private initializeGoogleButton(attempt = 0): void {
        if (!this.googleConfigured || !this.googleButton) {
            return;
        }
        if (!window.google?.accounts?.id) {
            if (attempt < 20) {
                this.googleLoadTimer = setTimeout(() => this.initializeGoogleButton(attempt + 1), 250);
            }
            return;
        }

        window.google.accounts.id.initialize({
            client_id: environment.googleClientId,
            callback: (response: GoogleCredentialResponse) => {
                this.ngZone.run(() => this.handleGoogleCredential(response));
            },
            auto_select: false,
            cancel_on_tap_outside: true
        });
        this.googleButton.nativeElement.innerHTML = '';
        window.google.accounts.id.renderButton(this.googleButton.nativeElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
            locale: 'pt-BR'
        });
    }

    private handleGoogleCredential(response: GoogleCredentialResponse): void {
        if (!response?.credential || this.loading) {
            return;
        }

        this.loading = true;
        const termsAccepted = !!this.loginForm.get('acceptTerms')?.value;
        this.authenticationService.loginWithGoogle(response.credential, termsAccepted).subscribe({
            next: () => {
                this.loading = false;
                this.navigateAfterAuthentication();
            },
            error: (message) => {
                this.loading = false;
                this.notificationService.openSnackBar(
                    typeof message === 'string' ? message : 'Nao foi possivel entrar com Google.'
                );
            }
        });
    }

    private navigateAfterAuthentication(): void {
        if (this.authenticationService.isProfileComplete()) {
            this.router.navigate(['/minha-conta']);
            return;
        }
        this.router.navigate(['/auth/completar-cadastro']);
    }
}


