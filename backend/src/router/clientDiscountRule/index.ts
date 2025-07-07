import { createClientDiscountRuleTrpcRoute } from './create.js';
import { getClientDiscountRuleTrpcRoute } from './getOne.js';
import { getAllClientDiscountRulesTrpcRoute } from './getAll.js';
import { getApplicableClientDiscountRulesTrpcRoute } from './getApplicableForClient.js';
import { editClientDiscountRuleTrpcRoute } from './edit.js';
import { deleteClientDiscountRuleTrpcRoute } from './delete.js';

export const clientDiscountRuleRoutes = {
  create: createClientDiscountRuleTrpcRoute,
  getOne: getClientDiscountRuleTrpcRoute,
  getAll: getAllClientDiscountRulesTrpcRoute,
  getApplicableForClient: getApplicableClientDiscountRulesTrpcRoute,
  edit: editClientDiscountRuleTrpcRoute,
  delete: deleteClientDiscountRuleTrpcRoute,
};
