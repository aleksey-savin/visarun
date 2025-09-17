import { createVisarunSeatPriceTrpcRoute } from './create.js';
import { getVisarunSeatPriceTrpcRoute } from './getOne.js';
import { getAllVisarunSeatPricesTrpcRoute } from './getAll.js';
import { editVisarunSeatPriceTrpcRoute } from './edit.js';
import { deleteVisarunSeatPriceTrpcRoute } from './delete.js';

export const visarunSeatPriceRoutes = {
  create: createVisarunSeatPriceTrpcRoute,
  getOne: getVisarunSeatPriceTrpcRoute,
  getAll: getAllVisarunSeatPricesTrpcRoute,
  edit: editVisarunSeatPriceTrpcRoute,
  delete: deleteVisarunSeatPriceTrpcRoute,
};
