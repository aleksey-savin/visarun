import { getAllRequirementDocumentsTrpcRoute } from './getAll.js';
import { getOneRequirementDocumentTrpcRoute } from './getOne.js';
import { createRequirementDocumentTrpcRoute } from './create.js';
import { editRequirementDocumentTrpcRoute } from './edit.js';
import { deleteRequirementDocumentTrpcRoute } from './delete.js';

export const requirementDocumentRoutes = {
  getAll: getAllRequirementDocumentsTrpcRoute,
  getOne: getOneRequirementDocumentTrpcRoute,
  create: createRequirementDocumentTrpcRoute,
  edit: editRequirementDocumentTrpcRoute,
  delete: deleteRequirementDocumentTrpcRoute,
};
