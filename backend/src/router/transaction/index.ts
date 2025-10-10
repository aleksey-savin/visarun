import { createTransactionTrpcRoute } from './create.js';
import { deleteTransactionTrpcRoute } from "./delete.js";
import { getAllTransactionsTrpcRoute } from "./getAll.js";
import {getAllTransactionsByCurrencyExchangeIdTrpcRoute} from "./getAllByExchangeId.js";
import {editTransactionTrpcRoute} from "./edit.js";
import {getOneTransactionTrpcRoute} from "./getOne.js";

export const transactionRoutes = {
    create: createTransactionTrpcRoute,
    edit: editTransactionTrpcRoute,
    delete: deleteTransactionTrpcRoute,
    getAll: getAllTransactionsTrpcRoute,
    getAllByCurrencyExchangeId: getAllTransactionsByCurrencyExchangeIdTrpcRoute,
    getOne: getOneTransactionTrpcRoute,
};
