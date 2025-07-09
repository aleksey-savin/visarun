import { getAllClientDocumentsTrpcRoute } from './getAll.js';
import { createClientDocumentTrpcRoute } from './create.js';
import { deleteClientDocumentTrpcRoute } from './delete.js';

export const clientDocumentRoutes = {
  getAll: getAllClientDocumentsTrpcRoute,
  create: createClientDocumentTrpcRoute,
  delete: deleteClientDocumentTrpcRoute,
};
