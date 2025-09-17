import { createVisarunRouteTransportTrpcRoute } from './create.js';
import { getVisarunRouteTransportTrpcRoute } from './getOne.js';
import { getAllVisarunRouteTransportsTrpcRoute } from './getAll.js';
import { editVisarunRouteTransportTrpcRoute } from './edit.js';
import { deleteVisarunRouteTransportTrpcRoute } from './delete.js';

export const visarunRouteTransportRoutes = {
  create: createVisarunRouteTransportTrpcRoute,
  getOne: getVisarunRouteTransportTrpcRoute,
  getAll: getAllVisarunRouteTransportsTrpcRoute,
  edit: editVisarunRouteTransportTrpcRoute,
  delete: deleteVisarunRouteTransportTrpcRoute,
};
