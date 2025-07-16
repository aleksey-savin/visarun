import { getAllAuditLogsTrpcRoute } from './getAll.js';
import { getOneAuditLogTrpcRoute } from './getOne.js';

export const auditRoutes = {
  getAll: getAllAuditLogsTrpcRoute,
  getOne: getOneAuditLogTrpcRoute,
};
