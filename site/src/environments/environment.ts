import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: false,
  logLevel: NgxLoggerLevel.TRACE,
  serverLogLevel: NgxLoggerLevel.OFF,
  authorization: '/oauth/oauth/token',
  login: '/login',
  link_creat_login: '/users/register',
  link_creat_valid_email: '/core/valid/email',
  link_donation_creat: '/donation',
  urlBase: '/api',
  assetsBaseUrl: 'https://d39d9tndfl7lxp.cloudfront.net',
  paymentsBaseUrl: '/api',
  stripePublishableKey: 'pk_test_51SwZqYDGla8YTkh15TvwJGILoOZoR9bFrlklKteced2TDjmCxUmoQMIGH3RnhCIhaCOiOFtvlnA4GgHQlOSG2axl00e6evIRTb',
  defaultCampaignId: '',
  nomeProjetoTitulo: 'mundocolorestore',
  apiUrl: '/api',
  labels: {
    menu: {
      dashboard: 'Dashboard',
      lista_doacao: 'Lista Doacoes',
      cria: 'Cria Doacao',
      perfil: 'Perfil',
      sair: 'Sair'
    }
  }
};
