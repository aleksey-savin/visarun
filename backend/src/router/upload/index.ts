import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import multer from 'multer';
import express from 'express';
import type { Request, Response } from 'express';
import { processImageFile } from '../../utils/imageConverter.js';
import { uploadFile, validateS3Config } from '../../services/s3.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Client configuration for direct presigned URL generation
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-central1',
  endpoint: process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// Configure multer for memory storage (files will be uploaded to S3)
const memoryStorage = multer.memoryStorage();

// File filter for all document types
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.pdf', '.doc', '.docx'];
  const fileExtension = '.' + file.originalname.split('.').pop()?.toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, HEIC, PDF, DOC, and DOCX files are allowed.'));
  }
};

// Configure multer for requirement document uploads
const requirementDocumentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Configure multer for client document uploads
const clientDocumentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Configure multer for payment document uploads
const paymentDocumentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Configure multer for transport report uploads
const transportReportUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Configure multer for banking details uploads
const bankingDetailsUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Configure multer for transaction checks uploads
const transactionCheckUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

// Common upload handler
async function handleFileUpload(
  req: Request & {
    file?: Express.Multer.File;
    body?: {
      orderId?: string;
      clientId?: string;
      requirementId?: string;
      tripTransportId?: string;
    };
  },
  res: Response,
  folder:
    | 'requirement-documents'
    | 'client-documents'
    | 'payment-documents'
    | 'transport-reports'
    | 'transaction-checks'
    | 'banking-details'
) {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    let fileBuffer = req.file.buffer;
    let mimeType = req.file.mimetype;

    // Generate filename based on database data
    let originalName = req.file.originalname;
    let customFileName = await generateServerFileName(req.body, originalName, folder);

    // Process image files (convert HEIC to PNG if needed)
    if (req.file.mimetype.includes('heic') || req.file.mimetype.includes('heif')) {
      try {
        const processedImage = await processImageFile(req.file.buffer, req.file.mimetype);
        fileBuffer = processedImage.buffer;
        mimeType = processedImage.mimeType;
        // Update filename extension if conversion happened
        if (processedImage.wasConverted) {
          originalName = originalName.replace(/\.(heic|heif)$/i, '.png');
          // Also update customFileName if it exists
          if (customFileName) {
            customFileName = customFileName.replace(/\.(heic|heif)$/i, '.png');
          }
        }
        console.log(`Converted HEIC image to ${processedImage.mimeType}`);
      } catch (error) {
        console.error('Error processing HEIC image:', error);
        res.status(400).json({
          success: false,
          error: 'Failed to process HEIC image',
        });
        return;
      }
    }

    // Upload to S3
    const uploadResult = await uploadFile({
      buffer: fileBuffer,
      originalName: originalName,
      mimeType,
      folder,
      customFileName: customFileName,
    });

    if (!uploadResult.success) {
      res.status(500).json({
        success: false,
        error: uploadResult.error || 'Upload failed',
      });
      return;
    }

    res.json({
      success: true,
      filePath: uploadResult.fileUrl, // S3 URL
      fileName: uploadResult.fileName,
      originalName: originalName,
      size: uploadResult.fileSize,
      mimetype: uploadResult.fileType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
}

// Generate filename on server-side based on database data
async function generateServerFileName(
  metadata:
    | {
        orderId?: string;
        clientId?: string;
        requirementId?: string;
        tripTransportId?: string;
        transactionId?: string;
      }
    | undefined,
  originalName: string,
  folder:
    | 'requirement-documents'
    | 'client-documents'
    | 'payment-documents'
    | 'transport-reports'
    | 'transaction-checks'
    | 'banking-details'
): Promise<string | undefined> {
  if (!metadata) return undefined;

  try {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    const extension = originalName.split('.').pop() || '';

    // Import Prisma client (assuming it's available)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    switch (folder) {
      case 'client-documents':
        if (metadata.clientId && metadata.requirementId) {
          const client = await prisma.client.findUnique({
            where: { id: metadata.clientId },
            select: { firstName: true, lastName: true },
          });

          const requirement = await prisma.requirement.findUnique({
            where: { id: metadata.requirementId },
            select: { title: true },
          });

          if (client && requirement) {
            const requirementName = requirement.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            return `${requirementName}-${client.lastName}-${client.firstName}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;

      case 'payment-documents':
        if (metadata.clientId || metadata.orderId) {
          let client;
          if (metadata.clientId) {
            client = await prisma.client.findUnique({
              where: { id: metadata.clientId },
              select: { firstName: true, lastName: true },
            });
          } else if (metadata.orderId) {
            const order = await prisma.order.findUnique({
              where: { id: metadata.orderId },
              include: { user: { select: { firstName: true, lastName: true } } },
            });

            if (order?.user) {
              client = order.user;
            }
          }

          if (client) {
            return `payment-doc-${client.lastName}-${client.firstName}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;

      case 'requirement-documents':
        if (metadata.requirementId) {
          const requirement = await prisma.requirement.findUnique({
            where: { id: metadata.requirementId },
            select: { title: true },
          });

          if (requirement) {
            const requirementName = requirement.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            return `${requirementName}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;

      case 'transport-reports':
        if (metadata.tripTransportId) {
          const tripTransport = await prisma.visarunTripTransport.findUnique({
            where: { id: metadata.tripTransportId },
            include: {
              transport: { select: { name: true } },
              trip: {
                select: {
                  departureDateTime: true,
                },
                include: {
                  route: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          });

          if (tripTransport) {
            const transportName = tripTransport.transport.name
              .replace(/[^a-zA-Z0-9]/g, '-')
              .toLowerCase();
            const routeName = tripTransport.trip.route.name
              ? tripTransport.trip.route.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
              : 'unknown-route';
            const dateStr = tripTransport.trip.departureDateTime.toISOString().slice(0, 10);
            return `transport-report-${routeName}-${transportName}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;

      case 'banking-details':
        if (metadata.clientId) {
          const client = await prisma.client.findUnique({
            where: { id: metadata.clientId },
            select: { firstName: true, lastName: true },
          });

          if (client) {
            return `banking-details-${client.lastName}-${client.firstName}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;

      case 'transaction-checks':
        if (metadata.transactionId) {
          const transaction = await prisma.transaction.findUnique({
            where: { id: metadata.transactionId },
          });

          if (transaction) {
            return `transaction-check-${transaction.id}-${dateStr}.${extension}`.toLowerCase();
          }
        }
        break;
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error generating server filename:', error);
  }

  return undefined;
}

export const createUploadRoutes = () => {
  const router = express.Router();

  // Validate S3 configuration on startup
  const s3Config = validateS3Config();
  if (!s3Config.valid) {
    console.error('S3 configuration errors:', s3Config.errors);
    throw new Error(`S3 configuration invalid: ${s3Config.errors.join(', ')}`);
  }
  console.log('S3 configuration validated successfully');

  // Upload requirement document file
  router.post(
    '/requirement-document',
    requirementDocumentUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          requirementId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'requirement-documents');
    }
  );

  // Upload client document file
  router.post(
    '/client-document',
    clientDocumentUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          clientId?: string;
          requirementId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'client-documents');
    }
  );

  // Upload payment document file
  router.post(
    '/payment-document',
    paymentDocumentUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          orderId?: string;
          clientId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'payment-documents');
    }
  );

  // Upload transport report file
  router.post(
    '/transport-reports',
    transportReportUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          tripTransportId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'transport-reports');
    }
  );

  router.post(
    '/banking-details',
    bankingDetailsUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          clientId?: string;
          requirementId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'banking-details');
    }
  );

  router.post(
    '/transaction-check',
    transactionCheckUpload.single('document'),
    async (
      req: Request & {
        file?: Express.Multer.File;
        body?: {
          transactionId?: string;
        };
      },
      res: Response
    ) => {
      await handleFileUpload(req, res, 'transaction-checks');
    }
  );

  // File access endpoint - serves files via presigned URLs or proxy
  router.get(/^\/file\/(.*)$/, async (req: Request, res: Response) => {
    try {
      // Extract the file path from the URL
      const filePath = req.params[0];
      if (!filePath) {
        res.status(400).json({ error: 'File path is required' });
        return;
      }

      // TODO: Add authentication/authorization checks here
      // Example: if (!req.user) { return res.status(401).json({ error: 'Unauthorized' }); }

      // Generate presigned URL directly from the file key (filePath)
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filePath,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      if (!presignedUrl) {
        res.status(404).json({ error: 'File not found or access denied' });
        return;
      }

      // Redirect to the presigned URL
      res.redirect(presignedUrl);
    } catch (error) {
      console.error('File access error:', error);
      res.status(500).json({ error: 'Failed to access file' });
    }
  });

  // Health check endpoint
  router.get('/health', (_req: Request, res: Response) => {
    const s3Config = validateS3Config();
    res.json({
      status: 'ok',
      s3Config: s3Config.valid,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
};

// TRPC routes for validation and metadata

const zUploadRequirementDocumentTrpcInput = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

const zUploadClientDocumentTrpcInput = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

const zUploadTransportReportTrpcInput = z.object({
  filePath: z.string().min(1, 'File path is required'),
});

export const validateRequirementDocumentUploadTrpcRoute = userCreateProcedure
  .input(zUploadRequirementDocumentTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file URL format (S3 URLs or legacy local URLs)
    const s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
    const isS3Url = filePath.includes(s3Endpoint);
    const isLegacyUrl = filePath.startsWith('/uploads/requirement-documents/');

    if (!isS3Url && !isLegacyUrl) {
      throw new Error('Invalid file path format');
    }

    return {
      success: true,
      filePath,
      isS3: isS3Url,
    };
  });

export const validateClientDocumentUploadTrpcRoute = userCreateProcedure
  .input(zUploadClientDocumentTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file URL format (S3 URLs or legacy local URLs)
    const s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
    const isS3Url = filePath.includes(s3Endpoint);
    const isLegacyUrl = filePath.startsWith('/uploads/client-documents/');

    if (!isS3Url && !isLegacyUrl) {
      throw new Error('Invalid file path format');
    }

    return {
      success: true,
      filePath,
      isS3: isS3Url,
    };
  });

export const validateTransportReportUploadTrpcRoute = userCreateProcedure
  .input(zUploadTransportReportTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file URL format (S3 URLs or legacy local URLs)
    const s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
    const isS3Url = filePath.includes(s3Endpoint);
    const isLegacyUrl = filePath.startsWith('/uploads/transport-reports/');

    if (!isS3Url && !isLegacyUrl) {
      throw new Error('Invalid file path format');
    }

    return {
      success: true,
      filePath,
      isS3: isS3Url,
    };
  });

// Upload routes for TRPC
export const uploadRoutes = {
  validateRequirementDocumentUpload: validateRequirementDocumentUploadTrpcRoute,
  validateClientDocumentUpload: validateClientDocumentUploadTrpcRoute,
  validateTransportReportUpload: validateTransportReportUploadTrpcRoute,
};
