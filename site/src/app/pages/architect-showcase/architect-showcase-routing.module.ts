import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArchitectShowcasePageComponent } from './architect-showcase-page.component';

const routes: Routes = [
  {
    path: '',
    component: ArchitectShowcasePageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ArchitectShowcaseRoutingModule {}
