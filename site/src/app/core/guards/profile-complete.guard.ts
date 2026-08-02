import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AuthenticationService } from '../services/auth.service';

@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  constructor(
    private authService: AuthenticationService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/auth/login']);
    }
    if (this.authService.isProfileComplete()) {
      return true;
    }
    return this.router.createUrlTree(['/auth/completar-cadastro'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }
}
