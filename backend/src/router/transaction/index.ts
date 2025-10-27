import { createTransactionTrpcRoute } from './create.js';
import { deleteTransactionTrpcRoute } from './delete.js';
import { getAllTransactionsTrpcRoute } from './getAll.js';
import { getAllTransactionsByCurrencyExchangeIdTrpcRoute } from './getAllByExchangeId.js';
import { editTransactionTrpcRoute } from './edit.js';
import { getOneTransactionTrpcRoute } from './getOne.js';
import { createMaximumTransactionTrpcRoute } from './createMaximum.js';
import { updateStatusTransactionTrpcRoute } from './updateStatus.js';

export const transactionRoutes = {
  create: createTransactionTrpcRoute,
  createMaximum: createMaximumTransactionTrpcRoute,
  edit: editTransactionTrpcRoute,
  delete: deleteTransactionTrpcRoute,
  getAll: getAllTransactionsTrpcRoute,
  getAllByCurrencyExchangeId: getAllTransactionsByCurrencyExchangeIdTrpcRoute,
  getOne: getOneTransactionTrpcRoute,
  updateStatus: updateStatusTransactionTrpcRoute,
};
