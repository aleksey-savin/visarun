import { createPickupLocationTrpcRoute } from './create.js';
import { getPickupLocationTrpcRoute } from './getOne.js';
import { getAllPickupLocationsTrpcRoute } from './getAll.js';
import { editPickupLocationTrpcRoute } from './edit.js';
import { deletePickupLocationTrpcRoute } from './delete.js';

export const pickupLocationRoutes = {
  create: createPickupLocationTrpcRoute,
  getOne: getPickupLocationTrpcRoute,
  getAll: getAllPickupLocationsTrpcRoute,
  edit: editPickupLocationTrpcRoute,
  delete: deletePickupLocationTrpcRoute,
};
