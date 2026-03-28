import { Component, OnInit, ChangeDetectorRef, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { timer } from 'rxjs';
import { Subscription } from 'rxjs';

import { AuthenticationService } from 'src/app/core/services/auth.service';
import { SpinnerService } from '../../core/services/spinner.service';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { Router } from '@angular/router';
import { GlobalService } from 'src/app/core/services/global.service';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-header-top',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})

export class HeaderComponent {
  @Input() Logado = false;
  assetsBaseUrl = environment.assetsBaseUrl;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private globalService: GlobalService
  ) {}

  logout(): void {
    this.authService.logout();
    this.Logado = false;
    this.router.navigate(['/']);
  }
}
