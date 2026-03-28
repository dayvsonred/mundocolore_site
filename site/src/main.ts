import { enableProdMode } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

registerLocaleData(localePt, 'pt-BR');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
