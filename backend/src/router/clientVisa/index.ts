import { createClientVisaTrpcRoute } from './create.js';
import { getClientVisaTrpcRoute } from './getOne.js';
import { getAllClientVisasTrpcRoute } from './getAll.js';
import { getClientVisasByClientTrpcRoute } from './getByClient.js';
import { getClientVisasByCountryTrpcRoute } from './getByCountry.js';
import { getExpiringClientVisasTrpcRoute } from './getExpiring.js';
import { editClientVisaTrpcRoute } from './edit.js';
import { markExpiryNotificationTrpcRoute } from './markExpiryNotification.js';
import { deleteClientVisaTrpcRoute } from './delete.js';

export const clientVisaRoutes = {
  create: createClientVisaTrpcRoute,
  getOne: getClientVisaTrpcRoute,
  getAll: getAllClientVisasTrpcRoute,
  getByClient: getClientVisasByClientTrpcRoute,
  getByCountry: getClientVisasByCountryTrpcRoute,
  getExpiring: getExpiringClientVisasTrpcRoute,
  edit: editClientVisaTrpcRoute,
  markExpiryNotification: markExpiryNotificationTrpcRoute,
  delete: deleteClientVisaTrpcRoute,
};
