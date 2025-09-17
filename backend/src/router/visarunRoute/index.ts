import { createVisarunRouteTrpcRoute } from './create.js';
import { getVisarunRouteTrpcRoute } from './getOne.js';
import { getAllVisarunRoutesTrpcRoute } from './getAll.js';
import { editVisarunRouteTrpcRoute } from './edit.js';
import { deleteVisarunRouteTrpcRoute } from './delete.js';

export const visarunRouteRoutes = {
  create: createVisarunRouteTrpcRoute,
  getOne: getVisarunRouteTrpcRoute,
  getAll: getAllVisarunRoutesTrpcRoute,
  edit: editVisarunRouteTrpcRoute,
  delete: deleteVisarunRouteTrpcRoute,
};
