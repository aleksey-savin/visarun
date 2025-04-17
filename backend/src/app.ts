import express from 'express';
import * as trpc from '@trpc/server/adapters/express';
import { TrpcRouter } from './trpc.ts';

const app = express();

app.use('/trpc', trpc.createExpressMiddleware({ router: TrpcRouter }));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

export type TrpcRouter = typeof TrpcRouter;
