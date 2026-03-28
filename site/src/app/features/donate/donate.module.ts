import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { DonateRoutingModule } from './donate-routing.module';
import { DonatePageComponent } from './donate-page.component';
import { DonationAmountSelectorComponent } from './components/donation-amount-selector/donation-amount-selector.component';
import { TipSelectorComponent } from './components/tip-selector/tip-selector.component';
import { PaymentMethodComponent } from './components/payment-method/payment-method.component';
import { DonationSummaryComponent } from './components/donation-summary/donation-summary.component';

@NgModule({
  declarations: [
    DonatePageComponent,
    DonationAmountSelectorComponent,
    TipSelectorComponent,
    PaymentMethodComponent,
    DonationSummaryComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DonateRoutingModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatCardModule,
    MatDividerModule
  ]
})
export class DonateModule {}
