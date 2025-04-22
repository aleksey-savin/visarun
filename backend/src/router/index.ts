import { trpc } from '../lib/trpc.js';
import { getAllUsersTrpcRoute } from './getAllUsers/index.js';
import { getUserTrpcRoute } from './getUser/index.js';
import { createUserRouter } from './createUser/index.js';
import { signupTrpcRoute } from './signup/index.js';
import { signinTrpcRoute } from './auth/signin.js';
import { exchangeRatesRouter } from './exchangeRates/index.js';
import { refreshTokenRoute } from './auth/refresh.js';
import { logoutTrpcRoute } from './auth/logout.js';

// Create the main router with all routes
export const appRouter = trpc.router({
  getAllUsers: getAllUsersTrpcRoute,
  getUser: getUserTrpcRoute,
  createUser: createUserRouter,
  signup: signupTrpcRoute,
  signin: signinTrpcRoute,
  exchangeRates: trpc.router(exchangeRatesRouter),
  refreshToken: refreshTokenRoute,
  logout: logoutTrpcRoute,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
