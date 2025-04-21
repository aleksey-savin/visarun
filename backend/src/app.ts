import express from 'express';
import cors from 'cors';
import { appRouter } from './router/index.ts';
import { applyTrpcToExpressApp } from './lib/trpc.ts';
import { createAppContext } from './lib/ctx.ts';

(async () => {
  try {
    const app = express();

    app.use(cors());

    // Apply tRPC to Express app
    await applyTrpcToExpressApp(app, appRouter);

    app.listen(3001, () => {
      console.log('Server is running on port 3001');
    });
  } catch (error) {
    console.error(error);
    // Disconnect Prisma on error
    const ctx = createAppContext();
    await ctx.stop();
  }
})();
