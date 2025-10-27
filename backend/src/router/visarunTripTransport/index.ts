import { createVisarunTripTransportTrpcRoute } from './create.js';
import { getByTripIdsTrpcRoute } from './getByTripIds.js';
import { deleteVisarunTripTransportTrpcRoute } from './delete.js';
import { editVisarunTripTransportTrpcRoute } from './edit.js';

export const visarunTripTransportRoutes = {
  create: createVisarunTripTransportTrpcRoute,
  getByTripIds: getByTripIdsTrpcRoute,
  delete: deleteVisarunTripTransportTrpcRoute,
  edit: editVisarunTripTransportTrpcRoute,
};
