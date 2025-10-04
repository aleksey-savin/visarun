import express from 'express';
import cors from 'cors';
import { appRouter } from './router/index.js';
import { applyTrpcToExpressApp } from './lib/trpc.js';
import { createAppContext } from './lib/ctx.js';
import { createUploadRoutes } from './router/upload/index.js';
import { startAutoCompleteOrdersJob, setupGracefulShutdown } from './jobs/autoCompleteOrders.js';
import { validateS3Config } from './services/s3.js';

(async () => {
  try {
    // Validate S3 configuration on startup
    const s3Config = validateS3Config();
    if (!s3Config.valid) {
      console.error('❌ S3 configuration errors:', s3Config.errors);
      console.error('Please check your .env file and ensure all S3 variables are set');
      process.exit(1);
    }
    console.log('✅ S3 configuration validated');

    const app = express();

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    // Upload routes (files now stored in S3)
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
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📁 Files are stored in S3 bucket: ${process.env.S3_BUCKET_NAME}`);
      console.log(`🏥 Health endpoint available at http://localhost:${PORT}/trpc/health`);
    });
  } catch (error) {
    console.error(error);
    // Disconnect Prisma on error
    const ctx = createAppContext();
    await ctx.stop();
  }
})();
