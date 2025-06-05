import express from 'express';
import cors from 'cors';
import { appRouter } from './router/index.js';
import { applyTrpcToExpressApp } from './lib/trpc.js';
import { createAppContext } from './lib/ctx.js';
import { initDefaultAdmin } from './utils/initDefaultAdmin.js';

(async () => {
  try {
    const app = express();

    app.use(cors());

    // Initialize default admin user if no users exist
    await initDefaultAdmin();

    // Simple health check endpoint
    app.get('/trpc/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Apply tRPC to Express app
    await applyTrpcToExpressApp(app, appRouter);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health endpoint available at http://localhost:${PORT}/trpc/health`);
    });
  } catch (error) {
    console.error(error);
    // Disconnect Prisma on error
    const ctx = createAppContext();
    await ctx.stop();
  }
})();
