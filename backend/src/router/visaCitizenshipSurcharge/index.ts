import { getAllVisaCitizenshipSurchargeTrpcRoute } from './getAll.js';
import { getOneVisaCitizenshipSurchargeTrpcRoute } from './getOne.js';
import { getVisaCitizenshipSurchargesByCountryTrpcRoute } from './getByCountry.js';
import { getVisaCitizenshipSurchargeByCitizenshipAndCountryTrpcRoute } from './getByCitizenshipAndCountry.js';
import { createVisaCitizenshipSurchargeTrpcRoute } from './create.js';
import { editVisaCitizenshipSurchargeTrpcRoute } from './edit.js';
import { deleteVisaCitizenshipSurchargeTrpcRoute } from './delete.js';

export const visaCitizenshipSurchargeRoute = {
  getAll: getAllVisaCitizenshipSurchargeTrpcRoute,
  getOne: getOneVisaCitizenshipSurchargeTrpcRoute,
  getByCountry: getVisaCitizenshipSurchargesByCountryTrpcRoute,
  getByCitizenshipAndCountry: getVisaCitizenshipSurchargeByCitizenshipAndCountryTrpcRoute,
  create: createVisaCitizenshipSurchargeTrpcRoute,
  edit: editVisaCitizenshipSurchargeTrpcRoute,
  delete: deleteVisaCitizenshipSurchargeTrpcRoute,
};
