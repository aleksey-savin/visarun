import { createClientPassportTrpcRoute } from './create.js';
import { getClientPassportTrpcRoute } from './getOne.js';
import { getAllClientPassportsTrpcRoute } from './getAll.js';
import { editClientPassportTrpcRoute } from './edit.js';
import { deleteClientPassportTrpcRoute } from './delete.js';

export const clientPassportRoutes = {
  create: createClientPassportTrpcRoute,
  getOne: getClientPassportTrpcRoute,
  getAll: getAllClientPassportsTrpcRoute,
  edit: editClientPassportTrpcRoute,
  delete: deleteClientPassportTrpcRoute,
};
