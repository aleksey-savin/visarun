import { createClientTrpcRoute } from './create.js';
import { getClientTrpcRoute } from './getOne.js';
import { getClientByUserIdTrpcRoute } from './getByUserId.js';
import { getAllClientsByUserIdTrpcRoute } from './getAllByUserId.js';
import { editClientTrpcRoute } from './edit.js';
import { deleteClientTrpcRoute } from './delete.js';

export const clientRoutes = {
  create: createClientTrpcRoute,
  getOne: getClientTrpcRoute,
  getByUserId: getClientByUserIdTrpcRoute,
  getAllByUserId: getAllClientsByUserIdTrpcRoute,
  edit: editClientTrpcRoute,
  delete: deleteClientTrpcRoute,
};
