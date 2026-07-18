import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserLayoutComponent } from 'src/app/shared/layouts/user-layout/user-layout.component';
import { AdminGuard } from 'src/app/core/guards/admin.guard';

import { AccountPageComponent } from './account-page/account-page.component';
import { BrandRegistrationComponent } from './brand-registration/brand-registration.component';
import { CollectionRegistrationComponent } from './collection-registration/collection-registration.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductRegistrationComponent } from './product-registration/product-registration.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminOrderPaymentsComponent } from './admin-order-payments/admin-order-payments.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AdminAnalyticsComponent } from './admin-analytics/admin-analytics.component';

const routes: Routes = [
  {
    path: '',
    component: UserLayoutComponent,
    children: [
      { path: '', component: AccountPageComponent },
      { path: 'meus-pedidos', loadChildren: () => import('./orders/orders.module').then(m => m.OrdersModule) },
      { path: 'meus-dados', loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule) },
      { path: 'meus-enderecos', loadChildren: () => import('./addresses/addresses.module').then(m => m.AddressesModule) },
      { path: 'meus-cartoes', loadChildren: () => import('./cards/cards.module').then(m => m.CardsModule) },
      { path: 'alterar-senha', component: ChangePasswordComponent },
      { path: 'cadastro-marcas', component: BrandRegistrationComponent, canActivate: [AdminGuard] },
      { path: 'cadastro-colecoes', component: CollectionRegistrationComponent, canActivate: [AdminGuard] },
      { path: 'cadastro-produtos', component: ProductRegistrationComponent, canActivate: [AdminGuard] },
      { path: 'cadastro-produtos/:brand', component: ProductRegistrationComponent, canActivate: [AdminGuard] },
      { path: 'lista-produtos', component: ProductListComponent, canActivate: [AdminGuard] },
      { path: 'lista-usuarios', component: AdminUsersComponent, canActivate: [AdminGuard] },
      { path: 'lista-pedidos', component: AdminOrdersComponent, canActivate: [AdminGuard] },
      { path: 'pedidos-pagamentos', component: AdminOrderPaymentsComponent, canActivate: [AdminGuard] },
      { path: 'analytics-acessos', component: AdminAnalyticsComponent, canActivate: [AdminGuard] },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
