import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S3 Client configuration for Yandex Cloud
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-central1',
  endpoint: process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net',
  forcePathStyle: true, // Try path-style URLs first for Yandex Cloud compatibility
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Validate required environment variables
if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  throw new Error(
    'Missing required S3 environment variables: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET_NAME'
  );
}

export interface UploadResult {
  success: boolean;
  fileUrl: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  error?: string;
}

export interface FileUploadParams {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: 'requirement-documents' | 'client-documents' | 'payment-documents' | 'transport-reports';
  customFileName?: string;
}

/**
 * Generate a unique filename with timestamp and random string
 */
function generateFileName(originalName: string, folder: string, customFileName?: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);

  if (customFileName) {
    // Clean custom filename - remove leading/trailing dashes and spaces
    const cleanCustomName = customFileName.trim().replace(/^-+|-+$/g, '');
    // Don't add extension if custom filename already has one
    const hasExtension = path.extname(cleanCustomName) !== '';
    return `${folder}/${cleanCustomName}${hasExtension ? '' : extension}`;
  }

  const baseName =
    folder === 'requirement-documents'
      ? 'requirement-doc'
      : folder === 'client-documents'
        ? 'client-doc'
        : folder === 'payment-documents'
          ? 'payment-doc'
          : 'transport-report';

  return `${folder}/${baseName}-${timestamp}-${randomString}${extension}`;
}

/**
 * Upload file to S3 bucket
 */
export async function uploadFile(params: FileUploadParams): Promise<UploadResult> {
  try {
    const fileName = generateFileName(params.originalName, params.folder, params.customFileName);

    // Debug logging
    console.log('🔧 S3 Upload Debug Info:');
    console.log('  Bucket:', BUCKET_NAME);
    console.log('  Region:', process.env.S3_REGION || 'ru-central1');
    console.log('  Endpoint:', process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net');
    console.log('  File Key:', fileName);
    console.log('  Content Type:', params.mimeType);
    console.log('  File Size:', params.buffer.length, 'bytes');

    const uploadParams: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: params.buffer,
      ContentType: params.mimeType,
      Metadata: {
        'original-name': params.originalName,
        'upload-date': new Date().toISOString(),
        folder: params.folder,
      },
    };

    // Encryption disabled for now - Yandex Cloud requires KMS setup
    // if (process.env.S3_KMS_KEY_ID) {
    //   uploadParams.ServerSideEncryption = ServerSideEncryption.aws_kms;
    //   uploadParams.SSEKMSKeyId = process.env.S3_KMS_KEY_ID;
    // }

    const command = new PutObjectCommand(uploadParams);
    console.log('📤 Attempting S3 upload...');
    await s3Client.send(command);
    console.log('✅ S3 upload successful');

    if (!BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME environment variable is not configured');
    }

    const fileUrl = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${fileName}`;

    return {
      success: true,
      fileUrl,
      fileName,
      originalName: params.originalName,
      fileSize: params.buffer.length,
      fileType: params.mimeType,
    };
  } catch (error) {
    console.error('❌ S3 upload error details:');
    console.error('  Error type:', error?.constructor?.name);
    console.error('  Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('  Full error:', error);

    // Log specific 405 error debugging info
    if (
      error instanceof Error &&
      (error.message.includes('405') || error.message.includes('Method Not Allowed'))
    ) {
      console.error('🔍 405 Error Debugging:');
      console.error('  This usually indicates:');
      console.error('  1. Incorrect endpoint URL');
      console.error('  2. Wrong forcePathStyle setting');
      console.error('  3. Bucket does not exist');
      console.error('  4. Insufficient permissions');
      console.error('  5. Wrong region configuration');
      console.error('  Current config:');
      console.error('    Endpoint:', process.env.S3_ENDPOINT);
      console.error('    Region:', process.env.S3_REGION);
      console.error('    Bucket:', BUCKET_NAME);
      console.error('    ForcePathStyle:', false);
    }

    return {
      success: false,
      fileUrl: '',
      fileName: '',
      originalName: params.originalName,
      fileSize: 0,
      fileType: params.mimeType,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete file from S3 bucket or local filesystem
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Handle S3 URLs
    if (fileUrl.includes(process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net')) {
      const fileName = extractFileNameFromUrl(fileUrl);
      if (!fileName) {
        console.error('Could not extract filename from URL:', fileUrl);
        return false;
      }

      const deleteParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await s3Client.send(command);

      console.log(`Successfully deleted S3 file: ${fileName}`);
      return true;
    }

    // Handle legacy local files
    if (fileUrl.startsWith('/uploads/')) {
      const fileName = fileUrl.replace('/uploads/', '');
      const localFilePath = path.join(__dirname, '../../uploads', fileName);

      try {
        await fs.access(localFilePath);
        await fs.unlink(localFilePath);
        console.log(`Successfully deleted local file: ${localFilePath}`);
        return true;
      } catch (error) {
        console.warn(`Local file not found or could not be deleted: ${localFilePath}`, error);
        return false;
      }
    }

    console.error('Unsupported file URL format:', fileUrl);
    return false;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
}

/**
 * Generate a presigned URL for temporary access to a file
 */
export async function getPresignedUrl(fileUrl: string, expiresIn = 3600): Promise<string | null> {
  try {
    const fileName = extractFileNameFromUrl(fileUrl);
    if (!fileName) {
      console.error('Could not extract filename from URL:', fileUrl);
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    return null;
  }
}

/**
 * Extract filename from S3 URL
 */
function extractFileNameFromUrl(fileUrl: string): string | null {
  try {
    // Handle S3 URL format: https://endpoint/bucket/path/file
    const s3Endpoint = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net';
    if (fileUrl.includes(s3Endpoint)) {
      const parts = fileUrl.split(s3Endpoint + '/')[1];
      // Remove bucket name from path: bucket/folder/file -> folder/file
      return parts.split('/').slice(1).join('/');
    }

    // Fallback for old local URLs (for migration)
    if (fileUrl.startsWith('/uploads/')) {
      return fileUrl.replace('/uploads/', '');
    }

    return null;
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return null;
  }
}

/**
 * Check if a file exists in S3
 */
export async function fileExists(fileUrl: string): Promise<boolean> {
  try {
    const fileName = extractFileNameFromUrl(fileUrl);
    if (!fileName) return false;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(fileUrl: string) {
  try {
    const fileName = extractFileNameFromUrl(fileUrl);
    if (!fileName) return null;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    const response = await s3Client.send(command);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return null;
  }
}

/**
 * Validate S3 configuration
 */
export function validateS3Config(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.S3_ACCESS_KEY_ID) {
    errors.push('S3_ACCESS_KEY_ID is required');
  }

  if (!process.env.S3_SECRET_ACCESS_KEY) {
    errors.push('S3_SECRET_ACCESS_KEY is required');
  }

  if (!process.env.S3_BUCKET_NAME) {
    errors.push('S3_BUCKET_NAME is required');
  }

  if (!process.env.S3_REGION) {
    errors.push('S3_REGION is required');
  }

  if (!process.env.S3_ENDPOINT) {
    errors.push('S3_ENDPOINT is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
