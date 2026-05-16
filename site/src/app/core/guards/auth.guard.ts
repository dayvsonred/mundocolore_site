import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import * as moment from 'moment';

import { AuthenticationService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private notificationService: NotificationService,
    private authService: AuthenticationService
  ) {}

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['auth/login']);
      return false;
    }

    if (!this.authService.isAuthenticated()) {
      this.notificationService.openSnackBar('Sua sessao expirou.');
      this.router.navigate(['auth/login']);
      return false;
    }

    if (user.expiration && moment().isSameOrAfter(moment(user.expiration))) {
      this.notificationService.openSnackBar('Sua sessao expirou.');
      this.router.navigate(['auth/login']);
      return false;
    }

    return true;
  }
}
