import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutPageComponent } from './checkout-page/checkout-page.component';
import { CustomMaterialModule } from '../../custom-material/custom-material.module';

@NgModule({
  declarations: [
    CheckoutPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CustomMaterialModule,
    CheckoutRoutingModule
  ]
})
export class CheckoutModule { }
