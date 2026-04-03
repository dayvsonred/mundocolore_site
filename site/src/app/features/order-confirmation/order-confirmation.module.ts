import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderConfirmationRoutingModule } from './order-confirmation-routing.module';
import { OrderConfirmationPageComponent } from './order-confirmation-page/order-confirmation-page.component';

@NgModule({
  declarations: [
    OrderConfirmationPageComponent
  ],
  imports: [
    CommonModule,
    OrderConfirmationRoutingModule
  ]
})
export class OrderConfirmationModule { }