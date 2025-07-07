import { getAllContactMethodsTrpcRoute } from './getAll.js';
import { getContactMethodTrpcRoute } from './getOne.js';
import { createContactMethodTrpcRoute } from './create.js';
import { deleteContactMethodTrpcRoute } from './delete.js';
import { editContactMethodTrpcRoute } from './edit.js';

export const contactMethodRoutes = {
  getAll: getAllContactMethodsTrpcRoute,
  getOne: getContactMethodTrpcRoute,
  create: createContactMethodTrpcRoute,
  edit: editContactMethodTrpcRoute,
  delete: deleteContactMethodTrpcRoute,
};
