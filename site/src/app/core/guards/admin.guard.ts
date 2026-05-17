import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {

    constructor(private router: Router,
        private authService: AuthenticationService) { }

    canActivate(): Observable<boolean> {
        const user = this.authService.getCurrentUser();

        if (!user) {
            this.router.navigate(['/']);
            return of(false);
        }

        return this.authService.refreshAdminStatus().pipe(
            map((isAdmin) => {
                if (isAdmin) {
                    return true;
                }

                this.router.navigate(['/']);
                return false;
            }),
            catchError(() => {
                this.router.navigate(['/']);
                return of(false);
            })
        );
    }
}
