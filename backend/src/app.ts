import express from 'express';
import cors from 'cors';

import { appRouter } from './router/index.ts';
import { applyTrpcToExpressApp } from './lib/trpc.ts';
import { AppContext, createAppContext } from './lib/ctx.ts';

(async () => {
  let ctx: AppContext | null = null;
  try {
    ctx = createAppContext();

    const app = express();

    app.use(cors());

    applyTrpcToExpressApp(app, ctx, appRouter);

    app.listen(3001, () => {
      console.log('Server is running on port 3001');
    });
  } catch (error) {
    console.error(error);
    await ctx?.stop();
  }
})();
