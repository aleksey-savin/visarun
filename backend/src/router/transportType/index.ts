import { createTransportTypeTrpcRoute } from './create.js';
import { getTransportTypeTrpcRoute } from './getOne.js';
import { getAllTransportTypesTrpcRoute } from './getAll.js';
import { editTransportTypeTrpcRoute } from './edit.js';
import { deleteTransportTypeTrpcRoute } from './delete.js';

export const transportTypeRoutes = {
  create: createTransportTypeTrpcRoute,
  getOne: getTransportTypeTrpcRoute,
  getAll: getAllTransportTypesTrpcRoute,
  edit: editTransportTypeTrpcRoute,
  delete: deleteTransportTypeTrpcRoute,
};
