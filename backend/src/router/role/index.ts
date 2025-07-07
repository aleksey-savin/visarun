import { getAllRolesTrpcRoute } from './getAll.js';
import { getOneRoleTrpcRoute } from './getOne.js';
import { createRoleTrpcRoute } from './create.js';
import { editRoleTrpcRoute } from './edit.js';
import { deleteRoleTrpcRoute } from './delete.js';
import { assignUserRoleTrpcRoute } from './assignUser.js';
import { unassignUserRoleTrpcRoute } from './unassignUser.js';
import { getUserRolesTrpcRoute } from './getUserRoles.js';

export const roleRoute = {
  getAll: getAllRolesTrpcRoute,
  getOne: getOneRoleTrpcRoute,
  create: createRoleTrpcRoute,
  edit: editRoleTrpcRoute,
  delete: deleteRoleTrpcRoute,
  assignUser: assignUserRoleTrpcRoute,
  unassignUser: unassignUserRoleTrpcRoute,
  getUserRoles: getUserRolesTrpcRoute,
};
