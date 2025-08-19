import { getAllOrderPaymentsTrpcRoute } from './getAll.js';
import { getOneOrderPaymentTrpcRoute } from './getOne.js';
import { createOrderPaymentTrpcRoute } from './create.js';
import { editOrderPaymentTrpcRoute } from './edit.js';
import { deleteOrderPaymentTrpcRoute } from './delete.js';
import { acceptOrderPaymentTrpcRoute } from './accept.js';

export const orderPaymentRoutes = {
  getAll: getAllOrderPaymentsTrpcRoute,
  getOne: getOneOrderPaymentTrpcRoute,
  create: createOrderPaymentTrpcRoute,
  edit: editOrderPaymentTrpcRoute,
  delete: deleteOrderPaymentTrpcRoute,
  accept: acceptOrderPaymentTrpcRoute,
};
