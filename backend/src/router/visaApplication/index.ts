import { createVisaApplicationTrpcRoute } from './create.js';
import { getVisaApplicationTrpcRoute } from './getOne.js';
import { getAllVisaApplicationsTrpcRoute } from './getAll.js';
import { editVisaApplicationTrpcRoute } from './edit.js';
import { updateVisaApplicationStatusTrpcRoute } from './updateStatus.js';
import { archiveVisaApplicationTrpcRoute } from './archive.js';
import { deleteVisaApplicationTrpcRoute } from './delete.js';

export const visaApplicationRoutes = {
  create: createVisaApplicationTrpcRoute,
  getOne: getVisaApplicationTrpcRoute,
  getAll: getAllVisaApplicationsTrpcRoute,
  edit: editVisaApplicationTrpcRoute,
  updateStatus: updateVisaApplicationStatusTrpcRoute,
  archive: archiveVisaApplicationTrpcRoute,
  delete: deleteVisaApplicationTrpcRoute,
};
