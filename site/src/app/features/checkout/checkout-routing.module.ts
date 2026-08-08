import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutPageComponent } from './checkout-page/checkout-page.component';
import { ProfileCompleteGuard } from '../../core/guards/profile-complete.guard';
import { InfinitePayReturnComponent } from './infinitepay-return/infinitepay-return.component';

const routes: Routes = [
  {
    path: 'infinitepay/payment',
    component: InfinitePayReturnComponent
  },
  {
    path: '',
    component: CheckoutPageComponent,
    canActivate: [ProfileCompleteGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutRoutingModule { }
