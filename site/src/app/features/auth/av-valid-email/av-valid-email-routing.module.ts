import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AvValidEmailComponent } from './av-valid-email.component';

const routes: Routes = [
	{
		path:'',
		component: AvValidEmailComponent
	}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AvValidEmailRoutingModule { }
