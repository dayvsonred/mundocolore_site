import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from 'src/app/shared/layout/layout.component';

import { DonationNewComponent } from './new/donation-new.component';
import { DonationListComponent } from './list/donation-list.component';
import { DonationViewComponent } from './view/donation-view.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'new', component: DonationNewComponent },
      { path: 'list', component: DonationListComponent },
      { path: 'view/:id', component: DonationViewComponent },
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DonationRoutingModule { }