import { createMessageTemplateTrpcRoute } from './create.js';
import { getAllMessageTemplatesTrpcRoute } from './getAll.js';
import { editMessageTemplateTrpcRoute } from './edit.js';
import { getOneMessageTemplateTrpcRoute } from './getOne.js';
import { deleteMessageTemplateTrpcRoute } from './delete.js';

export const messageTemplateRoute = {
  getAll: getAllMessageTemplatesTrpcRoute,
  create: createMessageTemplateTrpcRoute,
  getOne: getOneMessageTemplateTrpcRoute,
  edit: editMessageTemplateTrpcRoute,
  delete: deleteMessageTemplateTrpcRoute,
};
