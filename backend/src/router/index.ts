import { trpc } from '../lib/trpc.ts';
import { getAllUsersTrpcRoute } from './getAllUsers/index.ts';
import { getUserTrpcRoute } from './getUser/index.ts';
import { createUserRouter } from './createUser/index.ts';
import { signupTrpcRoute } from './signup/index.ts';
import { signinTrpcRoute } from './auth/signin.ts';
import { exchangeRatesRouter } from './exchangeRates/index.ts';
import { refreshTokenRoute } from './auth/refresh.ts';
import { logoutTrpcRoute } from './auth/logout.ts';

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
