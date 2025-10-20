import { createOrderTrpcRoute } from './create.js';
import { getOrderTrpcRoute } from './getOne.js';
import { getAllOrdersTrpcRoute } from './getAll.js';
import { editOrderTrpcRoute } from './edit.js';
import { deleteOrderTrpcRoute } from './delete.js';

export const orderRoutes = {
  create: createOrderTrpcRoute,
  getOne: getOrderTrpcRoute,
  getAll: getAllOrdersTrpcRoute,
  edit: editOrderTrpcRoute,
  delete: deleteOrderTrpcRoute,
};
