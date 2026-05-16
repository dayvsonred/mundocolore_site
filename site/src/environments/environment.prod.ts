import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: true,
  logLevel: NgxLoggerLevel.OFF,
  serverLogLevel: NgxLoggerLevel.ERROR,
  authorization: `/oauth/oauth/token`,
  login: `/login`,
	link_creat_login: `/users/register`,
  link_creat_valid_email: `/core/valid/email`,
  link_donation_creat: `/donation`,
  urlBase: `https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod`,
  assetsBaseUrl: `https://d39d9tndfl7lxp.cloudfront.net`,
  paymentsBaseUrl: `https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod`,
  stripePublishableKey: `pk_live_51SwnVuFQWFrYSXHwySkOcZjdetiOXTPEDs2Kd5jJzlU5vHODv6UzEhJxZKSPCyEZoCuxTpvibQZysvBLsM8Q7ZV000d6eD7DY0`,
  defaultCampaignId: ``,
  nomeProjetoTitulo: `mundocolorestore`,
  apiUrl: `https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod`,
};
