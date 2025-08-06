import { createOrderItemTrpcRoute } from './create.js';
import { getOrderItemTrpcRoute } from './getOne.js';
import { getAllOrderItemsByOrderIdTrpcRoute } from './getAllByOrderId.js';
import { getAllOrderItemsByClientIdTrpcRoute } from './getAllByClientId.js';
import { editOrderItemTrpcRoute } from './edit.js';
import { deleteOrderItemTrpcRoute } from './delete.js';
import { recalculateOrderItemSurchargesTrpcRoute } from './recalculateSurcharges.js';

export const orderItemRoutes = {
  create: createOrderItemTrpcRoute,
  getOne: getOrderItemTrpcRoute,
  getAllByOrderId: getAllOrderItemsByOrderIdTrpcRoute,
  getAllByClientId: getAllOrderItemsByClientIdTrpcRoute,
  edit: editOrderItemTrpcRoute,
  delete: deleteOrderItemTrpcRoute,
  recalculateSurcharges: recalculateOrderItemSurchargesTrpcRoute,
};
