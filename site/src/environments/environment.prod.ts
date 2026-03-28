import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  production: true,
  logLevel: NgxLoggerLevel.OFF,
  serverLogLevel: NgxLoggerLevel.ERROR,
  authorization: `/oauth/oauth/token`,
  login: `/login`,
	link_creat_login: `/users`,
  link_creat_valid_email: `/core/valid/email`,
  link_donation_creat: `/donation`,
  urlBase: `https://rm0t2sapef.execute-api.us-east-1.amazonaws.com`,
  assetsBaseUrl: `https://d39d9tndfl7lxp.cloudfront.net`,
  paymentsBaseUrl: `https://rm0t2sapef.execute-api.us-east-1.amazonaws.com`,
  stripePublishableKey: `pk_live_51SwnVuFQWFrYSXHwySkOcZjdetiOXTPEDs2Kd5jJzlU5vHODv6UzEhJxZKSPCyEZoCuxTpvibQZysvBLsM8Q7ZV000d6eD7DY0`,
  defaultCampaignId: ``,
  nomeProjetoTitulo: `mundocolorestore`
};
