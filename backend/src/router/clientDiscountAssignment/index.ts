import { createClientDiscountAssignmentTrpcRoute } from './create.js';
import { getClientDiscountAssignmentTrpcRoute } from './getOne.js';
import { getAllClientDiscountAssignmentsByClientTrpcRoute } from './getAllByClient.js';
import { getAllClientDiscountAssignmentsByRuleTrpcRoute } from './getAllByRule.js';
import { editClientDiscountAssignmentTrpcRoute } from './edit.js';
import { deleteClientDiscountAssignmentTrpcRoute } from './delete.js';

export const clientDiscountAssignmentRoutes = {
  create: createClientDiscountAssignmentTrpcRoute,
  getOne: getClientDiscountAssignmentTrpcRoute,
  getAllByClient: getAllClientDiscountAssignmentsByClientTrpcRoute,
  getAllByRule: getAllClientDiscountAssignmentsByRuleTrpcRoute,
  edit: editClientDiscountAssignmentTrpcRoute,
  delete: deleteClientDiscountAssignmentTrpcRoute,
};
