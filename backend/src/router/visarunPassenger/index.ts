import { createVisarunPassengerTrpcRoute } from './create.js';
import { deleteVisarunPassengerTrpcRoute } from './delete.js';
import { updateVisarunPassengerTrpcRoute } from './update.js';
import { getOccupiedSeatsTrpcRoute } from './getOccupiedSeats.js';
import { getAllVisarunPassengersTrpcRoute } from './getAll.js';

export const visarunPassengerRouter = {
  getAll: getAllVisarunPassengersTrpcRoute,
  create: createVisarunPassengerTrpcRoute,
  update: updateVisarunPassengerTrpcRoute,
  delete: deleteVisarunPassengerTrpcRoute,
  getOccupiedSeats: getOccupiedSeatsTrpcRoute,
};
