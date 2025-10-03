import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import express, { Request, Response } from 'express';
import { processImageFile } from '../../utils/imageConverter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for requirement document uploads
const requirementDocumentStorage = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, '../../../uploads/requirement-documents');
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `requirement-doc-${uniqueSuffix}${ext}`);
  },
});

const requirementDocumentUpload = multer({
  storage: requirementDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
      cb(
        new Error('Invalid file type. Only JPG, PNG, HEIC, PDF, DOC, and DOCX files are allowed.')
      );
    }
  },
});

// Configure multer for client document uploads
const clientDocumentStorage = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, '../../../uploads/client-documents');
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `client-doc-${uniqueSuffix}${ext}`);
  },
});

const clientDocumentUpload = multer({
  storage: clientDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
      cb(
        new Error('Invalid file type. Only JPG, PNG, HEIC, PDF, DOC, and DOCX files are allowed.')
      );
    }
  },
});

// Configure multer for payment document uploads
const paymentDocumentStorage = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, '../../../uploads/payment-documents');
    try {
      await fs.access(uploadPath);
    } catch {
      await fs.mkdir(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-doc-${uniqueSuffix}${ext}`);
  },
});

const paymentDocumentUpload = multer({
  storage: paymentDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
      cb(
        new Error('Invalid file type. Only JPG, PNG, HEIC, PDF, DOC, and DOCX files are allowed.')
      );
    }
  },
});

// Express routes for file upload
export const createUploadRoutes = () => {
  const router = express.Router();

  // Upload requirement document file
  router.post(
    '/requirement-document',
    requirementDocumentUpload.single('document'),
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
          return;
        }

        console.log('=== REQUIREMENT DOCUMENT UPLOAD DEBUG ===');
        console.log('Original file:', req.file.originalname);
        console.log('Original mimetype:', req.file.mimetype);
        console.log('File path:', req.file.path);

        // Process image file (convert HEIC to PNG if needed)
        const processResult = await processImageFile(
          req.file.path,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('Process result:', processResult);
        if (processResult.error) {
          console.warn('Image processing failed:', processResult.error);
        }

        // Use the processed file path (converted if HEIC, original otherwise)
        const finalFileName = path.basename(processResult.filePath);
        const filePath = `/uploads/requirement-documents/${finalFileName}`;

        res.json({
          success: true,
          filePath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: processResult.wasConverted ? 'image/png' : req.file.mimetype,
          converted: processResult.wasConverted,
          ...(processResult.originalExtension && {
            originalFormat: processResult.originalExtension,
          }),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'File upload failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Upload client document file
  router.post(
    '/client-document',
    clientDocumentUpload.single('document'),
    async (
      req: Request & { file?: Express.Multer.File; body?: { customFileName?: string } },
      res: Response
    ) => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
          return;
        }

        console.log('=== CLIENT DOCUMENT UPLOAD DEBUG ===');
        console.log('Original file:', req.file.originalname);
        console.log('Original mimetype:', req.file.mimetype);
        console.log('File path:', req.file.path);
        console.log('Custom filename from frontend:', req.body?.customFileName);

        // Process image file (convert HEIC to PNG if needed)
        const processResult = await processImageFile(
          req.file.path,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('Process result:', processResult);
        if (processResult.error) {
          console.warn('Image processing failed:', processResult.error);
        }

        let finalFileName = path.basename(processResult.filePath);
        const workingFilePath = processResult.filePath;

        // If customFileName is provided, rename the file
        if (req.body?.customFileName) {
          const ext = processResult.wasConverted ? '.png' : path.extname(req.file.originalname);
          const customName = req.body.customFileName;
          const finalCustomName = customName.endsWith(ext) ? customName : `${customName}${ext}`;

          const newFilePath = path.join(path.dirname(workingFilePath), finalCustomName);

          try {
            await fs.rename(workingFilePath, newFilePath);
            finalFileName = finalCustomName;
          } catch (renameError) {
            console.warn('Failed to rename file, using original name:', renameError);
          }
        }

        // Return the file path
        const filePath = `/uploads/client-documents/${finalFileName}`;
        res.json({
          success: true,
          filePath,
          fileName: finalFileName,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: processResult.wasConverted ? 'image/png' : req.file.mimetype,
          converted: processResult.wasConverted,
          ...(processResult.originalExtension && {
            originalFormat: processResult.originalExtension,
          }),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'File upload failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Upload payment document file
  router.post(
    '/payment-document',
    paymentDocumentUpload.single('document'),
    async (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
          return;
        }

        console.log('=== PAYMENT DOCUMENT UPLOAD DEBUG ===');
        console.log('Original file:', req.file.originalname);
        console.log('Original mimetype:', req.file.mimetype);
        console.log('File path:', req.file.path);

        // Process image file (convert HEIC to PNG if needed)
        const processResult = await processImageFile(
          req.file.path,
          req.file.originalname,
          req.file.mimetype
        );

        console.log('Process result:', processResult);
        if (processResult.error) {
          console.warn('Image processing failed:', processResult.error);
        }

        // Use the processed file path (converted if HEIC, original otherwise)
        const finalFileName = path.basename(processResult.filePath);
        const filePath = `/uploads/payment-documents/${finalFileName}`;

        res.json({
          success: true,
          filePath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: processResult.wasConverted ? 'image/png' : req.file.mimetype,
          converted: processResult.wasConverted,
          ...(processResult.originalExtension && {
            originalFormat: processResult.originalExtension,
          }),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'File upload failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Serve uploaded requirement document files
  router.get('/requirement-documents/:filename', async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../../../uploads/requirement-documents', filename);

      // Check if file exists
      await fs.access(filePath);

      // Send file
      res.sendFile(filePath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }
  });

  // Serve uploaded client document files
  router.get('/client-documents/:filename', async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../../../uploads/client-documents', filename);

      // Check if file exists
      await fs.access(filePath);

      // Send file
      res.sendFile(filePath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }
  });

  // Serve uploaded payment document files
  router.get('/payment-documents/:filename', async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../../../uploads/payment-documents', filename);

      // Check if file exists
      await fs.access(filePath);

      // Send file
      res.sendFile(filePath);
    } catch {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }
  });

  return router;
};

// tRPC route for requirement document validation
export const zUploadRequirementDocumentTrpcInput = z.object({
  filePath: z.string().min(1),
});

export const validateRequirementDocumentUploadTrpcRoute = userCreateProcedure
  .input(zUploadRequirementDocumentTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file path format
    if (!filePath.startsWith('/uploads/requirement-documents/')) {
      throw new Error('Invalid file path');
    }

    return {
      success: true,
      filePath,
    };
  });

// tRPC route for client document validation
export const zUploadClientDocumentTrpcInput = z.object({
  filePath: z.string().min(1),
});

export const validateClientDocumentUploadTrpcRoute = userCreateProcedure
  .input(zUploadClientDocumentTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file path format
    if (!filePath.startsWith('/uploads/client-documents/')) {
      throw new Error('Invalid file path');
    }

    return {
      success: true,
      filePath,
    };
  });

// tRPC route for payment document validation
export const zUploadPaymentDocumentTrpcInput = z.object({
  filePath: z.string().min(1),
});

export const validatePaymentDocumentUploadTrpcRoute = userCreateProcedure
  .input(zUploadPaymentDocumentTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file path format
    if (!filePath.startsWith('/uploads/payment-documents/')) {
      throw new Error('Invalid file path');
    }

    return {
      success: true,
      filePath,
    };
  });

export const uploadRoutes = {
  validateRequirementDocumentUpload: validateRequirementDocumentUploadTrpcRoute,
  validateClientDocumentUpload: validateClientDocumentUploadTrpcRoute,
  validatePaymentDocumentUpload: validatePaymentDocumentUploadTrpcRoute,
};
