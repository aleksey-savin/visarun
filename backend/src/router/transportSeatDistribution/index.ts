import { getTransportSeatDistributionTrpcRoute } from './getByTransport.js';
import { updateTransportSeatDistributionTrpcRoute } from './update.js';
import { deleteTransportSeatDistributionTrpcRoute } from './delete.js';

export const transportSeatDistributionRoutes = {
  getByTransport: getTransportSeatDistributionTrpcRoute,
  update: updateTransportSeatDistributionTrpcRoute,
  delete: deleteTransportSeatDistributionTrpcRoute,
};
