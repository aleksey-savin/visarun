import { getAllVisaFreeTrpcRoute } from './getAll.js';
import { getOneVisaFreeTrpcRoute } from './getOne.js';
import { createVisaFreeTrpcRoute } from './create.js';
import { editVisaFreeTrpcRoute } from './edit.js';
import { deleteVisaFreeTrpcRoute } from './delete.js';

export const visaFreeRoute = {
  getAll: getAllVisaFreeTrpcRoute,
  getOne: getOneVisaFreeTrpcRoute,
  create: createVisaFreeTrpcRoute,
  edit: editVisaFreeTrpcRoute,
  delete: deleteVisaFreeTrpcRoute,
};
