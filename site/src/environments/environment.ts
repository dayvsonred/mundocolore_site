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
  assetsBaseUrl: 'https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod',
  paymentsBaseUrl: '/api',
  stripePublishableKey: 'pk_test_51SwZqYDGla8YTkh15TvwJGILoOZoR9bFrlklKteced2TDjmCxUmoQMIGH3RnhCIhaCOiOFtvlnA4GgHQlOSG2axl00e6evIRTb',
  defaultCampaignId: '',
  nomeProjetoTitulo: 'mundocolorestore',
  apiUrl: 'https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod',
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
