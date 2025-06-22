import { getAllCountriesTrpcRoute } from './getAll.js';
import { getOneCountryTrpcRoute } from './getOne.js';
import { createCountryTrpcRoute } from './create.js';
import { editCountryTrpcRoute } from './edit.js';
import { deleteCountryTrpcRoute } from './delete.js';

export const countryRoute = {
  getAll: getAllCountriesTrpcRoute,
  getOne: getOneCountryTrpcRoute,
  create: createCountryTrpcRoute,
  edit: editCountryTrpcRoute,
  delete: deleteCountryTrpcRoute,
};
