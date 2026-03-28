import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';


import { SharedModule } from 'src/app/shared/shared.module';
import { ShowComponent } from './show/show.component';
import { CampaignRoutingModule } from './campaign-routing.module';
import { DonationModalComponent } from './payment/donation-modal.component';
import { QrCodeComponent } from './qr/qr-code.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { QRCodeModule } from 'angularx-qrcode';
import { NgxMaskModule } from 'ngx-mask';
import { CreateComponent } from './create/create.component';
import { DialogSimpleMessageComponent } from './dialog-simple-message/dialog-simple-message.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    CampaignRoutingModule,
    MatDialogModule, // Necessário para o modal
    MatButtonModule, // Necessário para botões
    QRCodeModule,
    NgxMaskModule.forRoot(),
    AngularEditorModule,

    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule

  ],
  declarations: [ShowComponent, DonationModalComponent, QrCodeComponent, CreateComponent, DialogSimpleMessageComponent]
})
export class CampaignModule { }
