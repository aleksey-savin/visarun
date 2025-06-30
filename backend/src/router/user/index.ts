import { getAllUsersTrpcRoute } from './getAll.js';
import { getUserTrpcRoute } from './getOne.js';
import { createUserTrpcRoute } from './create.js';
import { deleteUserTrpcRoute } from './delete.js';
import { editUserTrpcRoute } from './edit.js';

export const userRoutes = {
  getAll: getAllUsersTrpcRoute,
  getOne: getUserTrpcRoute,
  create: createUserTrpcRoute,
  edit: editUserTrpcRoute,
  delete: deleteUserTrpcRoute,
};
