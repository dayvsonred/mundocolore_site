import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductDetailRoutingModule } from './product-detail-routing.module';
import { ProductDetailPageComponent } from './product-detail-page/product-detail-page.component';

@NgModule({
  declarations: [
    ProductDetailPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ProductDetailRoutingModule
  ]
})
export class ProductDetailModule { }