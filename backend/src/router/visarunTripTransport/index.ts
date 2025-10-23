import { createVisarunTripTransportTrpcRoute } from './create.js';
import { getByTripIdsTrpcRoute } from './getByTripIds.js';
import { deleteVisarunTripTransportTrpcRoute } from './delete.js';

export const visarunTripTransportRoutes = {
  create: createVisarunTripTransportTrpcRoute,
  getByTripIds: getByTripIdsTrpcRoute,
  delete: deleteVisarunTripTransportTrpcRoute,
};
