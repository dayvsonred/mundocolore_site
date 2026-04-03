import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderConfirmationPageComponent } from './order-confirmation-page/order-confirmation-page.component';

const routes: Routes = [
  {
    path: '',
    component: OrderConfirmationPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderConfirmationRoutingModule { }