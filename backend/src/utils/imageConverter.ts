import heicConvert from 'heic-convert';
import fs from 'fs/promises';
import path from 'path';

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  originalPath: string;
  error?: string;
}

/**
 * Checks if a file is a HEIC file based on extension and mimetype
 */
export function isHeicFile(filename: string, mimetype?: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const heicExtensions = ['.heic', '.heif'];
  const heicMimetypes = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

  return heicExtensions.includes(ext) || (!!mimetype && heicMimetypes.includes(mimetype));
}

/**
 * Converts a HEIC file to PNG format
 * @param inputPath - Path to the input HEIC file
 * @param outputDir - Directory where the converted PNG file should be saved
 * @param outputFileName - Optional custom filename for the output (without extension)
 * @returns Promise<ConversionResult>
 */
export async function convertHeicToPng(
  inputPath: string,
  outputDir?: string,
  outputFileName?: string
): Promise<ConversionResult> {
  try {
    // Read the HEIC file
    const inputBuffer = await fs.readFile(inputPath);

    // Convert HEIC to PNG
    const outputBuffer = await heicConvert({
      buffer: inputBuffer as unknown as ArrayBufferLike,
      format: 'PNG',
      quality: 1, // Max quality for PNG
    });

    // Determine output path
    const inputFileName = path.basename(inputPath, path.extname(inputPath));
    const finalOutputFileName = outputFileName || inputFileName;
    const outputPath = outputDir
      ? path.join(outputDir, `${finalOutputFileName}.png`)
      : path.join(path.dirname(inputPath), `${finalOutputFileName}.png`);

    // Write the converted PNG file
    await fs.writeFile(outputPath, Buffer.from(outputBuffer));

    // Optionally remove the original HEIC file
    try {
      await fs.unlink(inputPath);
    } catch (unlinkError) {
      console.warn('Failed to remove original HEIC file:', unlinkError);
    }

    return {
      success: true,
      outputPath,
      originalPath: inputPath,
    };
  } catch (error) {
    return {
      success: false,
      originalPath: inputPath,
      error: error instanceof Error ? error.message : 'Unknown conversion error',
    };
  }
}

/**
 * Converts HEIC file to PNG if needed, returns the final file path
 * @param filePath - Path to the file that might need conversion
 * @param filename - Original filename
 * @param mimetype - File mimetype
 * @returns Promise<{filePath: string, wasConverted: boolean, originalExtension?: string}>
 */
export async function processImageFile(
  filePath: string,
  filename: string,
  mimetype?: string
): Promise<{
  filePath: string;
  wasConverted: boolean;
  originalExtension?: string;
  error?: string;
}> {
  if (!isHeicFile(filename, mimetype)) {
    return {
      filePath,
      wasConverted: false,
    };
  }

  try {
    const originalExtension = path.extname(filename).toLowerCase();
    const baseFileName = path.basename(filename, originalExtension);

    const conversionResult = await convertHeicToPng(filePath, path.dirname(filePath), baseFileName);

    if (conversionResult.success && conversionResult.outputPath) {
      return {
        filePath: conversionResult.outputPath,
        wasConverted: true,
        originalExtension,
      };
    } else {
      return {
        filePath,
        wasConverted: false,
        error: conversionResult.error || 'Conversion failed',
      };
    }
  } catch (error) {
    return {
      filePath,
      wasConverted: false,
      error: error instanceof Error ? error.message : 'Processing failed',
    };
  }
}
