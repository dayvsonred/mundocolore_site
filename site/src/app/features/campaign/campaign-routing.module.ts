import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShowComponent } from './show/show.component';
import { QrCodeComponent } from './qr/qr-code.component';
import { CreateComponent } from './create/create.component';


const routes: Routes = [
  { path: '', component: ShowComponent },
  { 
    path: 'qr', 
    component: QrCodeComponent,
    data: { title: 'Pagamento via PIX' } // Opcional: adiciona metadados para a rota
  },
  {
    path: 'doacao',
    component: CreateComponent,
    data: { title: 'Criando Evento' } // Opcional: adiciona metadados para a rota
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CampaignRoutingModule { }
