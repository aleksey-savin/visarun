import { saveExchangeRateTrpcRoute } from './saveExchangeRate.js';
import { getLatestExchangeRateTrpcRoute } from './getLatestExchangeRate.js';

export const exchangeRatesRoute = {
  saveExchangeRate: saveExchangeRateTrpcRoute,
  getLatestExchangeRate: getLatestExchangeRateTrpcRoute,
};
