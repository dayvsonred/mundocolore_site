import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { CustomMaterialModule } from './custom-material/custom-material.module';
import { AppRoutingModule } from './app-routing.module';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { environment } from '../environments/environment';
import { QRCodeModule } from 'angularx-qrcode';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    SharedModule,
    CustomMaterialModule.forRoot(),
    AppRoutingModule,
    QRCodeModule,
    //NgxCurrencyModule,
    // LoggerModule.forRoot({
    //   serverLoggingUrl: `http://my-api/logs`,
    //   level: environment.logLevel,
    //   serverLogLevel: environment.serverLogLevel
    // })
    LoggerModule.forRoot({
      level: NgxLoggerLevel.DEBUG, // nivel de log desejado
      // outras configuracoes opcionais
    })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
