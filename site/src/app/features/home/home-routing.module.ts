import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { ComplaintComponent } from './complaint/complaint.component';
import { PolicyComponent } from './policy/policy.component';
import { NewsComponent } from './news/news.component';
import { LegalComponent } from './legal/legal.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: 'complaint', component: ComplaintComponent },
      //{ path: 'policy', component: PolicyComponent },
    ],
  },
  { path: 'policy', component: PolicyComponent },
  { path: 'novidades', component: NewsComponent },
  { path: 'termos', component: LegalComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
