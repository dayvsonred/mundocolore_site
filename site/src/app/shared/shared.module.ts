import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
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

const maskConfig: Partial<IConfig> = {
    thousandSeparator: '.',
    decimalMarker: ',',
    allowNegativeNumbers: false
  };


@NgModule({
    imports: [
        RouterModule,
        CustomMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        MatInputModule,
        MatFormFieldModule,
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
    ]
})
export class SharedModule { }
