import heicConvert from 'heic-convert';

export interface BufferConversionResult {
  buffer: Buffer;
  mimeType: string;
  wasConverted: boolean;
  originalExtension?: string;
  error?: string;
}

/**
 * Checks if a file is a HEIC file based on extension and mimetype
 */
export function isHeicFile(filename: string, mimetype?: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  const heicExtensions = ['heic', 'heif'];
  const heicMimetypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

  return (ext && heicExtensions.includes(ext)) || (!!mimetype && heicMimetypes.includes(mimetype));
}

/**
 * Converts a HEIC buffer to JPEG format with compression
 * @param inputBuffer - Buffer containing HEIC image data
 * @param quality - JPEG quality (0-100, default: 85)
 * @returns Promise<Buffer> - Converted JPEG buffer
 */
export async function convertHeicToJpeg(
  inputBuffer: Buffer,
  quality: number = 85
): Promise<Buffer> {
  try {
    const outputBuffer = await heicConvert({
      buffer: inputBuffer as unknown as ArrayBufferLike,
      format: 'JPEG',
      quality: quality / 100, // heic-convert expects quality as 0-1
    });

    return Buffer.from(outputBuffer);
  } catch (error) {
    console.error('HEIC to JPEG conversion error:', error);
    throw new Error(
      `Failed to convert HEIC to JPEG: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Processes image buffer - converts HEIC to JPEG if needed
 * @param buffer - Image buffer
 * @param mimetype - Original file mimetype
 * @param quality - JPEG quality for conversion (0-100, default: 85)
 * @returns Promise<BufferConversionResult>
 */
export async function processImageFile(
  buffer: Buffer,
  mimetype?: string,
  quality: number = 85
): Promise<BufferConversionResult> {
  // If not a HEIC file, return original buffer
  if (!mimetype || (!mimetype.includes('heic') && !mimetype.includes('heif'))) {
    return {
      buffer,
      mimeType: mimetype || 'application/octet-stream',
      wasConverted: false,
    };
  }

  try {
    const originalExtension = mimetype.includes('heic') ? '.heic' : '.heif';

    // Convert HEIC to JPEG with quality compression
    const convertedBuffer = await convertHeicToJpeg(buffer, quality);

    return {
      buffer: convertedBuffer,
      mimeType: 'image/jpeg',
      wasConverted: true,
      originalExtension,
    };
  } catch (error) {
    console.error('Image processing error:', error);

    // If conversion fails, return original buffer with error
    return {
      buffer,
      mimeType: mimetype || 'application/octet-stream',
      wasConverted: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}

/**
 * Enhanced HEIC conversion with format and quality options
 * @param inputBuffer - Buffer containing HEIC image data
 * @param format - Output format ('JPEG' or 'PNG')
 * @param quality - Quality for JPEG (0-100, ignored for PNG)
 * @returns Promise<Buffer> - Converted buffer
 */
export async function convertHeicWithOptions(
  inputBuffer: Buffer,
  format: 'JPEG' | 'PNG' = 'JPEG',
  quality: number = 85
): Promise<Buffer> {
  try {
    const options: {
      buffer: ArrayBufferLike;
      format: 'JPEG' | 'PNG';
      quality?: number;
    } = {
      buffer: inputBuffer as unknown as ArrayBufferLike,
      format: format,
    };

    // Only add quality for JPEG format
    if (format === 'JPEG') {
      options.quality = quality / 100; // heic-convert expects quality as 0-1
    }

    const outputBuffer = await heicConvert(options);
    return Buffer.from(outputBuffer);
  } catch (error) {
    console.error(`HEIC to ${format} conversion error:`, error);
    throw new Error(
      `Failed to convert HEIC to ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Enhanced image processing with format and quality control
 * @param buffer - Image buffer
 * @param mimetype - Original file mimetype
 * @param outputFormat - Desired output format ('JPEG' | 'PNG')
 * @param quality - JPEG quality (0-100, ignored for PNG)
 * @returns Promise<BufferConversionResult>
 */
export async function processImageFileWithOptions(
  buffer: Buffer,
  mimetype?: string,
  outputFormat: 'JPEG' | 'PNG' = 'JPEG',
  quality: number = 85
): Promise<BufferConversionResult> {
  // If not a HEIC file, return original buffer
  if (!mimetype || (!mimetype.includes('heic') && !mimetype.includes('heif'))) {
    return {
      buffer,
      mimeType: mimetype || 'application/octet-stream',
      wasConverted: false,
    };
  }

  try {
    const originalExtension = mimetype.includes('heic') ? '.heic' : '.heif';

    // Convert HEIC with specified format and quality
    const convertedBuffer = await convertHeicWithOptions(buffer, outputFormat, quality);

    return {
      buffer: convertedBuffer,
      mimeType: outputFormat === 'JPEG' ? 'image/jpeg' : 'image/png',
      wasConverted: true,
      originalExtension,
    };
  } catch (error) {
    console.error('Enhanced image processing error:', error);

    // If conversion fails, return original buffer with error
    return {
      buffer,
      mimeType: mimetype || 'application/octet-stream',
      wasConverted: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}

/**
 * Estimate output file size based on input size and quality
 * @param inputSizeBytes - Original HEIC file size in bytes
 * @param quality - JPEG quality (0-100)
 * @returns Estimated output size in bytes
 */
export function estimateJpegSize(inputSizeBytes: number, quality: number): number {
  // Rough estimation: HEIC is highly compressed, JPEG size depends on quality
  // These are approximate multipliers based on typical compression ratios
  const qualityMultipliers: Record<number, number> = {
    95: 8.0, // High quality, larger files
    90: 6.0,
    85: 4.5, // Good balance
    80: 3.5,
    75: 2.8,
    70: 2.2, // More compressed
    65: 1.8,
    60: 1.5, // Heavy compression
  };

  // Find closest quality level or interpolate
  const qualities = Object.keys(qualityMultipliers)
    .map(Number)
    .sort((a, b) => b - a);
  let multiplier = 4.5; // default for quality 85

  for (let i = 0; i < qualities.length - 1; i++) {
    const higher = qualities[i];
    const lower = qualities[i + 1];

    if (quality >= higher) {
      multiplier = qualityMultipliers[higher];
      break;
    } else if (quality > lower) {
      // Linear interpolation
      const ratio = (quality - lower) / (higher - lower);
      multiplier =
        qualityMultipliers[lower] +
        ratio * (qualityMultipliers[higher] - qualityMultipliers[lower]);
      break;
    }
  }

  if (quality <= 60) multiplier = 1.5;
  if (quality >= 95) multiplier = 8.0;

  return Math.round(inputSizeBytes * multiplier);
}

/**
 * Find optimal JPEG quality to stay under target file size
 * @param inputSizeBytes - Original HEIC file size in bytes
 * @param targetSizeBytes - Target output size in bytes
 * @returns Recommended JPEG quality (30-95)
 */
export function findOptimalQuality(inputSizeBytes: number, targetSizeBytes: number): number {
  // Binary search for optimal quality
  let minQuality = 30; // Don't go below 30 for reasonable image quality
  let maxQuality = 95;

  while (maxQuality - minQuality > 2) {
    const testQuality = Math.round((minQuality + maxQuality) / 2);
    const estimatedSize = estimateJpegSize(inputSizeBytes, testQuality);

    if (estimatedSize <= targetSizeBytes) {
      minQuality = testQuality;
    } else {
      maxQuality = testQuality - 1;
    }
  }

  // Test remaining qualities
  for (let q = maxQuality; q >= minQuality; q--) {
    if (estimateJpegSize(inputSizeBytes, q) <= targetSizeBytes) {
      return q;
    }
  }

  return Math.max(30, minQuality); // Ensure we don't go below minimum quality
}

/**
 * Convert HEIC with automatic quality optimization for target size
 * @param inputBuffer - Buffer containing HEIC image data
 * @param targetSizeMB - Target output size in MB (default: 3MB)
 * @returns Promise<{buffer: Buffer, quality: number, actualSizeMB: number}>
 */
export async function convertHeicOptimized(
  inputBuffer: Buffer,
  targetSizeMB: number = 3
): Promise<{ buffer: Buffer; quality: number; actualSizeMB: number }> {
  const inputSizeBytes = inputBuffer.length;
  const targetSizeBytes = targetSizeMB * 1024 * 1024;

  // Find optimal quality
  const optimalQuality = findOptimalQuality(inputSizeBytes, targetSizeBytes);

  // Convert with optimal quality
  const convertedBuffer = await convertHeicWithOptions(inputBuffer, 'JPEG', optimalQuality);
  const actualSizeMB = convertedBuffer.length / (1024 * 1024);

  return {
    buffer: convertedBuffer,
    quality: optimalQuality,
    actualSizeMB: Number(actualSizeMB.toFixed(2)),
  };
}

/**
 * Get file extension from mimetype
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };

  return mimeMap[mimeType] || '';
}

/**
 * Validate image buffer
 */
export function validateImageBuffer(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }

  // Basic validation based on file headers
  const imageSignatures: Record<string, number[]> = {
    'image/jpeg': [0xff, 0xd8, 0xff],
    'image/png': [0x89, 0x50, 0x4e, 0x47],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };

  const signature = imageSignatures[mimeType];
  if (signature) {
    return signature.every((byte, index) => buffer[index] === byte);
  }

  // For HEIC files, just check if buffer has content
  if (mimeType.includes('heic') || mimeType.includes('heif')) {
    return buffer.length > 0;
  }

  return true; // Default to valid for other types
}
