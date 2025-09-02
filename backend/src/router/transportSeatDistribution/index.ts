import { getTransportSeatDistributionTrpcRoute } from './getByTransport';
import { updateTransportSeatDistributionTrpcRoute } from './update';
import { deleteTransportSeatDistributionTrpcRoute } from './delete';

export const transportSeatDistributionRoutes = {
  getByTransport: getTransportSeatDistributionTrpcRoute,
  update: updateTransportSeatDistributionTrpcRoute,
  delete: deleteTransportSeatDistributionTrpcRoute,
};
