import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxMaskModule, IConfig } from 'ngx-mask'; // Importar o módulo

import { CustomMaterialModule } from '../custom-material/custom-material.module';
import { LimitToPipe } from './pipes/limit-to.pipe';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ContentPlaceholderAnimationComponent } from './content-placeholder-animation/content-placeholder-animation.component';
import { LocalDatePipe } from './pipes/local-date.pipe';
import { YesNoPipe } from './pipes/yes-no.pipe';
import { LayoutComponent } from './layout/layout.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { UserSidebarComponent } from './components/user-sidebar/user-sidebar.component';
import { UserLayoutComponent } from './layouts/user-layout/user-layout.component';

const maskConfig: Partial<IConfig> = {
    thousandSeparator: '.',
    decimalMarker: ',',
    allowNegativeNumbers: false
  };


@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        CustomMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatBadgeModule,
        MatTooltipModule,
        NgxMaskModule.forRoot(maskConfig),
    ],
    declarations: [
        ConfirmDialogComponent,
        ContentPlaceholderAnimationComponent,
        LimitToPipe,
        LocalDatePipe,
        YesNoPipe,
        LayoutComponent,
        HeaderComponent,
        FooterComponent,
        ProductCardComponent,
        NavbarComponent,
        UserSidebarComponent,
        UserLayoutComponent,
    ],
    exports: [
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        CustomMaterialModule,
        LimitToPipe,
        ConfirmDialogComponent,
        ContentPlaceholderAnimationComponent,
        LocalDatePipe,
        YesNoPipe,
        HeaderComponent,
        FooterComponent,
        ProductCardComponent,
        NavbarComponent,
        UserSidebarComponent,
        UserLayoutComponent,
    ]
})
export class SharedModule { }
