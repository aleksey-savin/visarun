import { createVisarunTripTransportTrpcRoute } from './create.js';
import { getByTripIdsTrpcRoute } from './getByTripIds.js';

export const visarunTripTransportRoutes = {
  create: createVisarunTripTransportTrpcRoute,
  getByTripIds: getByTripIdsTrpcRoute,
};
