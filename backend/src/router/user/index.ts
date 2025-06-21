import { getAllUsersTrpcRoute } from './getAll';
import { getUserTrpcRoute } from './getOne';
import { createUserTrpcRoute } from './create';
import { deleteUserTrpcRoute } from './delete';
import { editUserTrpcRoute } from './edit';

export const userRoutes = {
  getAll: getAllUsersTrpcRoute,
  getOne: getUserTrpcRoute,
  create: createUserTrpcRoute,
  edit: editUserTrpcRoute,
  delete: deleteUserTrpcRoute,
};
