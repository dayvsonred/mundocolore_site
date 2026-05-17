import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserLayoutComponent } from 'src/app/shared/layouts/user-layout/user-layout.component';
import { AdminGuard } from 'src/app/core/guards/admin.guard';

import { AccountPageComponent } from './account-page/account-page.component';
import { ProductRegistrationComponent } from './product-registration/product-registration.component';

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
      { path: 'cadastro-produtos', component: ProductRegistrationComponent, canActivate: [AdminGuard] },
      { path: 'cadastro-produtos/:brand', component: ProductRegistrationComponent, canActivate: [AdminGuard] },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountRoutingModule { }
