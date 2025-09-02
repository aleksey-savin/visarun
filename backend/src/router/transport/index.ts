import { createTransportTrpcRoute } from './create.js';
import { getTransportTrpcRoute } from './getOne.js';
import { getAllTransportsTrpcRoute } from './getAll.js';
import { editTransportTrpcRoute } from './edit.js';
import { deleteTransportTrpcRoute } from './delete.js';

export const transportRoutes = {
  create: createTransportTrpcRoute,
  getOne: getTransportTrpcRoute,
  getAll: getAllTransportsTrpcRoute,
  edit: editTransportTrpcRoute,
  delete: deleteTransportTrpcRoute,
};
