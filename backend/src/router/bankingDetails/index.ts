import { createBankingDetailsTrpcRoute } from './create.js';
import { editBankingDetailsTrpcRoute } from './edit.js';
import { getOneBankingDetailsTrpcRoute } from './getOne.js';
import { getOneBankingDetailsByClientIdTrpcRoute } from './getOneByClientId.js';
import { deleteBankingDetailsTrpcRoute } from './delete.js';

export const bankingDetailsRoutes = {
  create: createBankingDetailsTrpcRoute,
  edit: editBankingDetailsTrpcRoute,
  getOne: getOneBankingDetailsTrpcRoute,
  getOneByClientId: getOneBankingDetailsByClientIdTrpcRoute,
  delete: deleteBankingDetailsTrpcRoute,
};
