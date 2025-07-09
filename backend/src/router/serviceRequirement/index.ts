import { getAllServiceRequirementsTrpcRoute } from './getAll.js';
import { createServiceRequirementTrpcRoute } from './create.js';
import { updateServiceRequirementTrpcRoute } from './update.js';
import {
  initializeServiceRequirementsTrpcRoute,
  getServiceRequirementsTrpcRoute,
  checkServiceReadinessTrpcRoute,
  validateRequirementInputTrpcRoute,
  getAvailableDocumentsTrpcRoute,
  submitRequirementTrpcRoute,
  bulkSubmitRequirementsTrpcRoute,
} from './manage.js';

export const serviceRequirementRoutes = {
  getAll: getAllServiceRequirementsTrpcRoute,
  create: createServiceRequirementTrpcRoute,
  update: updateServiceRequirementTrpcRoute,
  initialize: initializeServiceRequirementsTrpcRoute,
  getForService: getServiceRequirementsTrpcRoute,
  checkReadiness: checkServiceReadinessTrpcRoute,
  validateInput: validateRequirementInputTrpcRoute,
  getAvailableDocuments: getAvailableDocumentsTrpcRoute,
  submit: submitRequirementTrpcRoute,
  bulkSubmit: bulkSubmitRequirementsTrpcRoute,
};
