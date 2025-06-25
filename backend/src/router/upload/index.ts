import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import express, { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    const uploadPath = path.join(__dirname, '../../../uploads/passports');
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
    cb(null, `passport-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'));
    }
  },
});

// Express routes for file upload
export const createUploadRoutes = () => {
  const router = express.Router();

  // Upload passport file
  router.post(
    '/passport',
    upload.single('passport'),
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
        const filePath = `/uploads/passports/${req.file.filename}`;
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

  // Serve uploaded files
  router.get('/passports/:filename', async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../../../uploads/passports', filename);

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

// tRPC route for validation (optional, can be used for additional validation)
export const zUploadPassportTrpcInput = z.object({
  filePath: z.string().min(1),
});

export const validatePassportUploadTrpcRoute = userCreateProcedure
  .input(zUploadPassportTrpcInput)
  .mutation(async ({ input }) => {
    const { filePath } = input;

    // Validate file path format
    if (!filePath.startsWith('/uploads/passports/')) {
      throw new Error('Invalid file path');
    }

    return {
      success: true,
      filePath,
    };
  });

export const uploadRoutes = {
  validatePassportUpload: validatePassportUploadTrpcRoute,
};
