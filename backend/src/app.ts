import express from 'express';
import cors from 'cors';
import { appRouter } from './router/index.js';
import { applyTrpcToExpressApp } from './lib/trpc.js';
import { createAppContext } from './lib/ctx.js';
import { createUploadRoutes } from './router/upload/index.js';
import { startAutoCompleteOrdersJob, setupGracefulShutdown } from './jobs/autoCompleteOrders.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const app = express();

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Serve static files from uploads directory
    app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Upload routes
    app.use('/upload', createUploadRoutes());

    // System initialization note
    console.log('⚠️  Note: To initialize system with default data, run:');
    console.log('  pnpm prisma:seed');

    // Simple health check endpoint
    app.get('/trpc/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Apply tRPC to Express app
    await applyTrpcToExpressApp(app, appRouter);

    // Start cron jobs
    startAutoCompleteOrdersJob();

    // Setup graceful shutdown
    setupGracefulShutdown();

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
