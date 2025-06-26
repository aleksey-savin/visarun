import { createVisaTypeTrpcRoute } from './create.js';
import { getVisaTypeTrpcRoute } from './getOne.js';
import { getAllVisaTypesTrpcRoute } from './getAll.js';
import { getVisaTypesByCountryTrpcRoute } from './getByCountry.js';
import { editVisaTypeTrpcRoute } from './edit.js';
import { deleteVisaTypeTrpcRoute } from './delete.js';

export const visaTypeRoutes = {
  create: createVisaTypeTrpcRoute,
  getOne: getVisaTypeTrpcRoute,
  getAll: getAllVisaTypesTrpcRoute,
  getByCountry: getVisaTypesByCountryTrpcRoute,
  edit: editVisaTypeTrpcRoute,
  delete: deleteVisaTypeTrpcRoute,
};
