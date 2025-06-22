import { getAllVisaNationalitySurchargeTrpcRoute } from './getAll.js';
import { getOneVisaNationalitySurchargeTrpcRoute } from './getOne.js';
import { createVisaNationalitySurchargeTrpcRoute } from './create.js';
import { editVisaNationalitySurchargeTrpcRoute } from './edit.js';
import { deleteVisaNationalitySurchargeTrpcRoute } from './delete.js';

export const visaNationalitySurchargeRoute = {
  getAll: getAllVisaNationalitySurchargeTrpcRoute,
  getOne: getOneVisaNationalitySurchargeTrpcRoute,
  create: createVisaNationalitySurchargeTrpcRoute,
  edit: editVisaNationalitySurchargeTrpcRoute,
  delete: deleteVisaNationalitySurchargeTrpcRoute,
};
