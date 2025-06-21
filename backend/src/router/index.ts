import { trpc } from '../lib/trpc.js';

import { signupTrpcRoute } from './auth/signup.js';
import { signinTrpcRoute } from './auth/signin.js';
import { userRoutes } from './user/index.js';
import { exchangeRatesRoute } from './exchangeRates/index.js';
import { refreshTokenRoute } from './auth/refresh.js';
import { logoutTrpcRoute } from './auth/logout.js';
import { changePasswordTrpcRoute, forceChangePasswordTrpcRoute } from './auth/changePassword.js';
import { telegramRoute } from './telegramChannel/index.js';
import { roleRoute } from './role/index.js';
import { permissionRoute } from './permission/index.js';

// Create the main router with all routes
export const appRouter = trpc.router({
  user: userRoutes,
  role: roleRoute,
  permission: permissionRoute,
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
