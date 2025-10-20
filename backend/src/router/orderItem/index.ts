import { createOrderItemTrpcRoute } from './create.js';
import { getOrderItemTrpcRoute } from './getOne.js';
import { editOrderItemTrpcRoute } from './edit.js';
import { deleteOrderItemTrpcRoute } from './delete.js';

export const orderItemRoutes = {
  create: createOrderItemTrpcRoute,
  getOne: getOrderItemTrpcRoute,
  edit: editOrderItemTrpcRoute,
  delete: deleteOrderItemTrpcRoute,
};
