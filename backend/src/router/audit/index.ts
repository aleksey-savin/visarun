import { getAllAuditLogsTrpcRoute } from './getAll.js';
import { getOneAuditLogTrpcRoute } from './getOne.js';
import { recoverEntityTrpcRoute } from './recover.js';
import { getFilterOptionsTrpcRoute } from './getFilterOptions.js';

export const auditRoutes = {
  getAll: getAllAuditLogsTrpcRoute,
  getOne: getOneAuditLogTrpcRoute,
  recover: recoverEntityTrpcRoute,
  getFilterOptions: getFilterOptionsTrpcRoute,
};
