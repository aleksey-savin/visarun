import { useState, useCallback } from 'react';
import heic2any from 'heic2any';

interface UseHeicConverterResult {
  convertHeicToJpeg: (src: string) => Promise<string>;
  isConverting: boolean;
  error: string | null;
}

export const useHeicConverter = (): UseHeicConverterResult => {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertHeicToJpeg = useCallback(async (src: string): Promise<string> => {
    // Check if it's a HEIC file
    const isHeicFile = src.toLowerCase().includes('.heic') || src.toLowerCase().includes('.heif');

    if (!isHeicFile) {
      return src; // Return original URL if not HEIC
    }

    setIsConverting(true);
    setError(null);

    try {
      // Fetch the HEIC file
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`Failed to fetch HEIC file: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Convert HEIC to JPEG
      const convertedBlob = (await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.8,
      })) as Blob;

      // Create object URL from converted blob
      const objectUrl = URL.createObjectURL(convertedBlob);
      return objectUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert HEIC file';
      setError(errorMessage);
      console.error('HEIC conversion error:', err);

      // Return original URL as fallback
      return src;
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    convertHeicToJpeg,
    isConverting,
    error,
  };
};
