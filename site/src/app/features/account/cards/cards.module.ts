import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';

import { CardsComponent } from './cards.component';

const routes: Routes = [
  { path: '', component: CardsComponent }
];

@NgModule({
  declarations: [CardsComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class CardsModule { }