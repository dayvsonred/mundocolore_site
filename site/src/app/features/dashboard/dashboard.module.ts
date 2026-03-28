import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHomeComponent } from './dashboard-home/dashboard-home.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [DashboardHomeComponent],
    imports: [
        CommonModule,
        DashboardRoutingModule,
        SharedModule,
        MatCardModule,
        MatButtonModule,
        FlexLayoutModule,
    ]
})
export class DashboardModule { }
