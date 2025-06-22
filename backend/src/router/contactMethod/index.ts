import { getAllContactMethodsTrpcRoute } from './getAll';
import { getContactMethodTrpcRoute } from './getOne';
import { createContactMethodTrpcRoute } from './create';
import { deleteContactMethodTrpcRoute } from './delete';
import { editContactMethodTrpcRoute } from './edit';

export const contactMethodRoutes = {
  getAll: getAllContactMethodsTrpcRoute,
  getOne: getContactMethodTrpcRoute,
  create: createContactMethodTrpcRoute,
  edit: editContactMethodTrpcRoute,
  delete: deleteContactMethodTrpcRoute,
};
