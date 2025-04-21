import { saveExchangeRateTrpcRoute } from './saveExchangeRate.ts';
import { getLatestExchangeRateTrpcRoute } from './getLatestExchangeRate.ts';

export const exchangeRatesRouter = {
  saveExchangeRate: saveExchangeRateTrpcRoute,
  getLatestExchangeRate: getLatestExchangeRateTrpcRoute,
};
