import { getAllBlacklistedTrpcRoute } from './getAll.js';
import { getOneBlacklistedTrpcRoute } from './getOne.js';
import { createBlacklistedTrpcRoute } from './create.js';
import { editBlacklistedTrpcRoute } from './edit.js';
import { deleteBlacklistedTrpcRoute } from './delete.js';

export const blacklistedRoute = {
  getAll: getAllBlacklistedTrpcRoute,
  getOne: getOneBlacklistedTrpcRoute,
  create: createBlacklistedTrpcRoute,
  edit: editBlacklistedTrpcRoute,
  delete: deleteBlacklistedTrpcRoute,
};
