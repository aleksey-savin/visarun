import { createVisarunPassengerTrpcRoute } from './create.js';
import { deleteVisarunPassengerTrpcRoute } from './delete.js';
import { getOccupiedSeatsTrpcRoute } from './getOccupiedSeats.js';
import { getPassengerCountsByRouteStopTrpcRoute } from './getPassengerCountsByRouteStop.js';

export const visarunPassengerRouter = {
  create: createVisarunPassengerTrpcRoute,
  delete: deleteVisarunPassengerTrpcRoute,
  getOccupiedSeats: getOccupiedSeatsTrpcRoute,
  getPassengerCountsByRouteStop: getPassengerCountsByRouteStopTrpcRoute,
};
