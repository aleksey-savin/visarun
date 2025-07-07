import { createVisaApplicationTrpcRoute } from './create.js';
import { getVisaApplicationTrpcRoute } from './getOne.js';
import { getAllVisaApplicationsTrpcRoute } from './getAll.js';
import { getVisaApplicationsByOrderItemTrpcRoute } from './getByOrderItem.js';
import { getVisaApplicationsByStatusTrpcRoute } from './getByStatus.js';
import { editVisaApplicationTrpcRoute } from './edit.js';
import { updateVisaApplicationStatusTrpcRoute } from './updateStatus.js';
import { deleteVisaApplicationTrpcRoute } from './delete.js';

export const visaApplicationRoutes = {
  create: createVisaApplicationTrpcRoute,
  getOne: getVisaApplicationTrpcRoute,
  getAll: getAllVisaApplicationsTrpcRoute,
  getByOrderItem: getVisaApplicationsByOrderItemTrpcRoute,
  getByStatus: getVisaApplicationsByStatusTrpcRoute,
  edit: editVisaApplicationTrpcRoute,
  updateStatus: updateVisaApplicationStatusTrpcRoute,
  delete: deleteVisaApplicationTrpcRoute,
};
