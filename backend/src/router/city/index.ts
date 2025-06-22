import { getAllCitiesTrpcRoute } from './getAll.js';
import { getOneCityTrpcRoute } from './getOne.js';
import { createCityTrpcRoute } from './create.js';
import { editCityTrpcRoute } from './edit.js';
import { deleteCityTrpcRoute } from './delete.js';
import { getCitiesByCountryTrpcRoute } from './getCitiesByCountry.js';

export const cityRoute = {
  getAll: getAllCitiesTrpcRoute,
  getOne: getOneCityTrpcRoute,
  create: createCityTrpcRoute,
  edit: editCityTrpcRoute,
  delete: deleteCityTrpcRoute,
  getCitiesByCountry: getCitiesByCountryTrpcRoute,
};
