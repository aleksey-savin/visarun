import { trpc } from '../lib/trpc.ts';
import { getAllUsersTrpcRoute } from './getAllUsers/index.ts';
import { getUserTrpcRoute } from './getUser/index.ts';
import { createUserRouter } from './createUser/index.ts';
import { signupTrpcRoute } from './signup/index.ts';

export const appRouter = trpc.router({
  getAllUsers: getAllUsersTrpcRoute,
  getUser: getUserTrpcRoute,
  createUser: createUserRouter,
  signup: signupTrpcRoute,
});

export type AppRouter = typeof appRouter;
