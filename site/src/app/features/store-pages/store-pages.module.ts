import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '../../shared/shared.module';
import { StorePagesRoutingModule } from './store-pages-routing.module';
import { StorePageComponent } from './store-page/store-page.component';

@NgModule({
  declarations: [
    StorePageComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    StorePagesRoutingModule
  ]
})
export class StorePagesModule { }
