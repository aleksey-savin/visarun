import { trpc } from '../lib/trpc.js';
import { getAllUsersTrpcRoute } from './getAllUsers/index.js';
import { getUserTrpcRoute } from './getUser/index.js';
import { createUserRouter } from './createUser/index.js';
import { deleteUserRouter } from './deleteUser/index.js';
import { signupTrpcRoute } from './signup/index.js';
import { signinTrpcRoute } from './auth/signin.js';
import { exchangeRatesRoute } from './exchangeRates/index.js';
import { refreshTokenRoute } from './auth/refresh.js';
import { logoutTrpcRoute } from './auth/logout.js';
import { changePasswordTrpcRoute, forceChangePasswordTrpcRoute } from './auth/changePassword.js';
import { telegramRoute } from './telegramChannel/index.js';

// Create the main router with all routes
export const appRouter = trpc.router({
  getAllUsers: getAllUsersTrpcRoute,
  getUser: getUserTrpcRoute,
  createUser: createUserRouter,
  deleteUser: deleteUserRouter,
  signup: signupTrpcRoute,
  signin: signinTrpcRoute,
  exchangeRates: exchangeRatesRoute,
  refreshToken: refreshTokenRoute,
  logout: logoutTrpcRoute,
  changePassword: changePasswordTrpcRoute,
  forceChangePassword: forceChangePasswordTrpcRoute,
  telegramChannel: telegramRoute,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
