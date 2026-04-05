import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  template: `
    <app-navbar></app-navbar>
    <main class="main-content" [class.no-margin]="isHome">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .main-content {
      margin-top: 80px;
    }
    
    .main-content.no-margin {
      margin-top: 0;
    }
  `]
})
export class AppComponent implements OnInit {
  isHome = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isHome = event.urlAfterRedirects === '/' || event.urlAfterRedirects === '/home';
      });
  }
}
