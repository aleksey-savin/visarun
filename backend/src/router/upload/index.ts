import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import express, { Request, Response } from 'express';

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
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, and DOCX files are allowed.'));
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
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, PDF, DOC, and DOCX files are allowed.'));
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
    (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
          return;
        }

        // Return the file path
        const filePath = `/uploads/requirement-documents/${req.file.filename}`;
        res.json({
          success: true,
          filePath,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
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
    (req: Request & { file?: Express.Multer.File }, res: Response) => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
          return;
        }

        // Return the file path
        const filePath = `/uploads/client-documents/${req.file.filename}`;
        res.json({
          success: true,
          filePath,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
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

export const uploadRoutes = {
  validateRequirementDocumentUpload: validateRequirementDocumentUploadTrpcRoute,
  validateClientDocumentUpload: validateClientDocumentUploadTrpcRoute,
};
