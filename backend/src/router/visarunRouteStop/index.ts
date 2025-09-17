import { createVisarunRouteStopTrpcRoute } from './create.js';
import { getVisarunRouteStopTrpcRoute } from './getOne.js';
import { getAllVisarunRouteStopsTrpcRoute } from './getAll.js';
import { editVisarunRouteStopTrpcRoute } from './edit.js';
import { deleteVisarunRouteStopTrpcRoute } from './delete.js';

export const visarunRouteStopRoutes = {
  create: createVisarunRouteStopTrpcRoute,
  getOne: getVisarunRouteStopTrpcRoute,
  getAll: getAllVisarunRouteStopsTrpcRoute,
  edit: editVisarunRouteStopTrpcRoute,
  delete: deleteVisarunRouteStopTrpcRoute,
};
