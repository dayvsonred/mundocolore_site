import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';

import { OrdersComponent } from './orders.component';

const routes: Routes = [
  { path: '', component: OrdersComponent }
];

@NgModule({
  declarations: [OrdersComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class OrdersModule { }