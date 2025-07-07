import { getUserContactMethodsTrpcRoute } from './getByUser.js';
import { createUserContactMethodTrpcRoute } from './create.js';
import { deleteUserContactMethodTrpcRoute } from './delete.js';
import { editUserContactMethodTrpcRoute } from './edit.js';

export const userContactMethodRoutes = {
  getByUser: getUserContactMethodsTrpcRoute,
  create: createUserContactMethodTrpcRoute,
  edit: editUserContactMethodTrpcRoute,
  delete: deleteUserContactMethodTrpcRoute,
};
