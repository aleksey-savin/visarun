import { createVisarunScheduleTrpcRoute } from './create.js';
import { getVisarunScheduleTrpcRoute } from './getOne.js';
import { getAllVisarunSchedulesTrpcRoute } from './getAll.js';
import { editVisarunScheduleTrpcRoute } from './edit.js';
import { deleteVisarunScheduleTrpcRoute } from './delete.js';

export const visarunScheduleRoutes = {
  create: createVisarunScheduleTrpcRoute,
  getOne: getVisarunScheduleTrpcRoute,
  getAll: getAllVisarunSchedulesTrpcRoute,
  edit: editVisarunScheduleTrpcRoute,
  delete: deleteVisarunScheduleTrpcRoute,
};
