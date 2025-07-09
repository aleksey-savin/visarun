import { getAllRequirementsTrpcRoute } from './getAll.js';
import { getOneRequirementTrpcRoute } from './getOne.js';
import { createRequirementTrpcRoute } from './create.js';
import { editRequirementTrpcRoute } from './edit.js';
import { deleteRequirementTrpcRoute } from './delete.js';
import { getRequirementsByVisaTypeTrpcRoute } from './getByVisaType.js';
import { getRequirementsByCitizenshipTrpcRoute } from './getByCitizenship.js';
import { validateRequirementInputTrpcRoute } from './validateInput.js';

export const requirementRoutes = {
  getAll: getAllRequirementsTrpcRoute,
  getOne: getOneRequirementTrpcRoute,
  create: createRequirementTrpcRoute,
  edit: editRequirementTrpcRoute,
  delete: deleteRequirementTrpcRoute,
  getByVisaType: getRequirementsByVisaTypeTrpcRoute,
  getByCitizenship: getRequirementsByCitizenshipTrpcRoute,
  validateInput: validateRequirementInputTrpcRoute,
};
