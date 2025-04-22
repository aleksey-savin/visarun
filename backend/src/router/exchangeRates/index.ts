import { saveExchangeRateTrpcRoute } from './saveExchangeRate.js';
import { getLatestExchangeRateTrpcRoute } from './getLatestExchangeRate.js';

export const exchangeRatesRouter = {
  saveExchangeRate: saveExchangeRateTrpcRoute,
  getLatestExchangeRate: getLatestExchangeRateTrpcRoute,
};
