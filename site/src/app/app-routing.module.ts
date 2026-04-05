import { NgModule } from '@angular/core';
import { Routes, RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthGuard } from './core/guards/auth.guard';
import { GlobalService } from './core/services/global.service';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule),
  },
  {
    path: 'catalog',
    loadChildren: () => import('./features/catalog/catalog.module').then(m => m.CatalogModule),
  },
  {
    path: 'product/:id',
    loadChildren: () => import('./features/product-detail/product-detail.module').then(m => m.ProductDetailModule),
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule),
  },
  {
    path: 'checkout',
    loadChildren: () => import('./features/checkout/checkout.module').then(m => m.CheckoutModule),
  },
  {
    path: 'order-confirmation',
    loadChildren: () => import('./features/order-confirmation/order-confirmation.module').then(m => m.OrderConfirmationModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'minha-conta',
    loadChildren: () => import('./features/account/account.module').then(m => m.AccountModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'home'
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
