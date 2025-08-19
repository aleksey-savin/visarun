import { getAllCurrenciesTrpcRoute } from './getAll.js';
import { getOneCurrencyTrpcRoute } from './getOne.js';
import { createCurrencyTrpcRoute } from './create.js';
import { editCurrencyTrpcRoute } from './edit.js';
import { deleteCurrencyTrpcRoute } from './delete.js';

export const currencyRoutes = {
  getAll: getAllCurrenciesTrpcRoute,
  getOne: getOneCurrencyTrpcRoute,
  create: createCurrencyTrpcRoute,
  edit: editCurrencyTrpcRoute,
  delete: deleteCurrencyTrpcRoute,
};
