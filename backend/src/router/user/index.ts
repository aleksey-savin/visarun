import { getAllUsersTrpcRoute } from './getAll';
import { getUserTrpcRoute } from './getOne';
import { createUserTrpcRoute } from './create';
import { deleteUserTrpcRoute } from './delete';

export const userRoutes = {
  getAll: getAllUsersTrpcRoute,
  getOne: getUserTrpcRoute,
  create: createUserTrpcRoute,
  delete: deleteUserTrpcRoute,
};
