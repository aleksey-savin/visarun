import { createCurrencyExchangeTrpcRoute } from './create.js';
import { deleteCurrencyExchangeTrpcRoute } from './delete.js';
import { getAllCurrencyExchangesTrpcRoute } from './getAll.js';
import { getOneCurrencyExchangeTrpcRoute } from './getOne.js';
import { editCurrencyExchangeTrpcRoute } from './edit.js';
import { updateCurrencyExchangeStatusTrpcRoute } from './updateStatus.ts';
import { getAllCurrencyExchangeCombinationsTrpcRoute } from './getAllCombinations.ts';

export const currencyExchangeRoutes = {
  create: createCurrencyExchangeTrpcRoute,
  edit: editCurrencyExchangeTrpcRoute,
  delete: deleteCurrencyExchangeTrpcRoute,
  getAll: getAllCurrencyExchangesTrpcRoute,
  getOne: getOneCurrencyExchangeTrpcRoute,
  updateStatus: updateCurrencyExchangeStatusTrpcRoute,
  getAllCombinations: getAllCurrencyExchangeCombinationsTrpcRoute,
};
