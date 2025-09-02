import { createSeatClassTrpcRoute } from './create.js';
import { getSeatClassTrpcRoute } from './getOne.js';
import { getAllSeatClassesTrpcRoute } from './getAll.js';
import { editSeatClassTrpcRoute } from './edit.js';
import { deleteSeatClassTrpcRoute } from './delete.js';

export const seatClassRoutes = {
  create: createSeatClassTrpcRoute,
  getOne: getSeatClassTrpcRoute,
  getAll: getAllSeatClassesTrpcRoute,
  edit: editSeatClassTrpcRoute,
  delete: deleteSeatClassTrpcRoute,
};
