import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogRoutingModule } from './catalog-routing.module';
import { CatalogPageComponent } from './catalog-page/catalog-page.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CatalogPageComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    CatalogRoutingModule,
    SharedModule
  ]
})
export class CatalogModule { }