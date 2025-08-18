import { createClientRequirementTrpcRoute } from './create.js';
import { updateClientRequirementTrpcRoute } from './update.js';
import { deleteClientRequirementTrpcRoute } from './delete.js';
import { getOneClientRequirementTrpcRoute } from './getOne.js';
import { getAllClientRequirementsTrpcRoute } from './getAll.js';

export const clientRequirementRoutes = {
  create: createClientRequirementTrpcRoute,
  update: updateClientRequirementTrpcRoute,
  delete: deleteClientRequirementTrpcRoute,
  getOne: getOneClientRequirementTrpcRoute,
  getAll: getAllClientRequirementsTrpcRoute,
};
