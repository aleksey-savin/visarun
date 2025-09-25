import { createVisarunTripTrpcRoute } from './create.js';
import { getVisarunTripTrpcRoute } from './getOne.js';
import { getAllVisarunTripsTrpcRoute } from './getAll.js';
import { editVisarunTripTrpcRoute } from './edit.js';
import { deleteVisarunTripTrpcRoute } from './delete.js';

export const visarunTripRoutes = {
  create: createVisarunTripTrpcRoute,
  getOne: getVisarunTripTrpcRoute,
  getAll: getAllVisarunTripsTrpcRoute,
  edit: editVisarunTripTrpcRoute,
  delete: deleteVisarunTripTrpcRoute,
};
