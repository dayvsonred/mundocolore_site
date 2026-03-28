import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthGuard } from './core/guards/auth.guard';
import { GlobalService } from './core/services/global.service';

const appRoutes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
    {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'donation',
    loadChildren: () => import('./features/donation/donation.module').then(m => m.DonationModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'customers',
    loadChildren: () => import('./features/customers/customers.module').then(m => m.CustomersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'account',
    loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'icons',
    loadChildren: () => import('./features/icons/icons.module').then(m => m.IconsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'typography',
    loadChildren: () => import('./features/typography/typography.module').then(m => m.TypographyModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'about',
    loadChildren: () => import('./features/about/about.module').then(m => m.AboutModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pg/:id',
    loadChildren: () => import('./features/campaign/campaign.module').then(m => m.CampaignModule),
  },
  {
    path: 's2/:id',
    redirectTo: 'pg/:id',
    pathMatch: 'full'
  },
  {
    path: 'donate',
    loadChildren: () => import('./features/donate/donate.module').then(m => m.DonateModule),
  },
  {
    path: 'architect',
    loadChildren: () => import('./pages/architect-showcase/architect-showcase.module').then(m => m.ArchitectShowcaseModule),
  },
  {
    path: 'portfolio-arquitetura',
    loadChildren: () => import('./pages/architect-showcase/architect-showcase.module').then(m => m.ArchitectShowcaseModule),
  },
  {
    path: 'Cloud-Engineer-Portfolio',
    loadChildren: () => import('./pages/architect-showcase/architect-showcase.module').then(m => m.ArchitectShowcaseModule),
  },
  {
    path: 'create',
    loadChildren: () => import('./features/campaign/campaign.module').then(m => m.CampaignModule),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full'
  }
  
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule {
  constructor(private router: Router, private globalService: GlobalService) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        const page = url.split('?')[0].split('#')[0] || '/home';
        this.globalService.sendPageVisualization({ page }).subscribe({
          error: () => {
            // Evita quebrar a navegação caso o endpoint falhe
          }
        });
      });
  }
}
