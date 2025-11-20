import { createCommentTrpcRoute } from './create.js';
import { getCommentTrpcRoute } from './getOne.js';
import { getAllCommentsTrpcRoute } from './getAll.js';
import { editCommentTrpcRoute } from './edit.js';
import { deleteCommentTrpcRoute } from './delete.js';

export const commentRoutes = {
  create: createCommentTrpcRoute,
  getOne: getCommentTrpcRoute,
  getAll: getAllCommentsTrpcRoute,
  edit: editCommentTrpcRoute,
  delete: deleteCommentTrpcRoute,
};
