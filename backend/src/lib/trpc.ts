import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { type Express } from 'express';
import { AppContext } from './ctx.ts';

// Create the tRPC instance without the circular import
export const trpc = initTRPC.context<AppContext>().create();

// Use a generic parameter with a type constraint that matches router objects
export const applyTrpcToExpressApp = <TRouter extends ReturnType<typeof trpc.router>>(
  app: Express,
  appContext: AppContext,
  router: TRouter
) => {
  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router,
      createContext: () => appContext,
    })
  );
};
