import { createOrderTrpcRoute } from './create.js';
import { getOrderTrpcRoute } from './getOne.js';
import { getAllOrdersTrpcRoute } from './getAll.js';
import { getAllOrdersByUserIdTrpcRoute } from './getAllByUserId.js';
import { editOrderTrpcRoute } from './edit.js';
import { deleteOrderTrpcRoute } from './delete.js';
import { getOrderSummaryTrpcRoute } from './getSummary.js';
import { calculateOrderPriceTrpcRoute } from './calculatePrice.js';

export const orderRoutes = {
  create: createOrderTrpcRoute,
  getOne: getOrderTrpcRoute,
  getAll: getAllOrdersTrpcRoute,
  getAllByUserId: getAllOrdersByUserIdTrpcRoute,
  edit: editOrderTrpcRoute,
  delete: deleteOrderTrpcRoute,
  getSummary: getOrderSummaryTrpcRoute,
  calculatePrice: calculateOrderPriceTrpcRoute,
};
