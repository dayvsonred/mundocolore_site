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
  urlBase: 'https://rm0t2sapef.execute-api.us-east-1.amazonaws.com',
  assetsBaseUrl: 'https://d39d9tndfl7lxp.cloudfront.net',
  paymentsBaseUrl: 'https://rm0t2sapef.execute-api.us-east-1.amazonaws.com',
  stripePublishableKey: 'pk_test_51SwZqYDGla8YTkh15TvwJGILoOZoR9bFrlklKteced2TDjmCxUmoQMIGH3RnhCIhaCOiOFtvlnA4GgHQlOSG2axl00e6evIRTb',
  defaultCampaignId: '',
  nomeProjetoTitulo: 'mundocolorestore',
  apiUrl: 'https://rm0t2sapef.execute-api.us-east-1.amazonaws.com',
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
