import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HomeComponent } from './home/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { PolicyComponent } from './policy/policy.component';
import { ComplaintComponent } from './complaint/complaint.component';
import { NewsComponent } from './news/news.component';
import { LegalComponent } from './legal/legal.component';

@NgModule({
    declarations: [HomeComponent, PolicyComponent, ComplaintComponent, NewsComponent, LegalComponent],
    imports: [
        CommonModule,
        HomeRoutingModule,
        SharedModule,
        MatCardModule,
        MatButtonModule,
        FlexLayoutModule,
        MatButtonModule, // Necessário para botões
        MatToolbarModule,
        MatIconModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatExpansionModule,
        MatBadgeModule
    ]
})
export class HomeModule { }
