import { getAllCitizenshipsTrpcRoute } from './getAll.js';
import { getOneCitizenshipTrpcRoute } from './getOne.js';
import { createCitizenshipTrpcRoute } from './create.js';
import { editCitizenshipTrpcRoute } from './edit.js';
import { deleteCitizenshipTrpcRoute } from './delete.js';

export const citizenshipRoute = {
  getAll: getAllCitizenshipsTrpcRoute,
  getOne: getOneCitizenshipTrpcRoute,
  create: createCitizenshipTrpcRoute,
  edit: editCitizenshipTrpcRoute,
  delete: deleteCitizenshipTrpcRoute,
};
