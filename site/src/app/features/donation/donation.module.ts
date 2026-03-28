import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DonationRoutingModule } from './donation-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { DonationNewComponent } from './new/donation-new.component';
import { DonationListComponent } from './list/donation-list.component';
import { DonationViewComponent } from './view/donation-view.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularEditorModule } from '@kolkov/angular-editor';

@NgModule({
    imports: [
        CommonModule,
        DonationRoutingModule,
        SharedModule,
        FlexLayoutModule,
        AngularEditorModule,
    ],
    declarations: [
        DonationNewComponent,
        DonationListComponent,
        DonationViewComponent
    ]
})
export class DonationModule { }