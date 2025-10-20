import React, { useState, useEffect } from 'react';
import { useHeicConverter } from '@/hooks/useHeicConverter';
import { Loader2 } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
  className = '',
  onError,
  onLoad,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [imageError, setImageError] = useState(false);
  const { convertHeicToJpeg, isConverting, error } = useHeicConverter();

  useEffect(() => {
    const handleHeicImage = async () => {
      try {
        const convertedSrc = await convertHeicToJpeg(src);
        setImageSrc(convertedSrc);
      } catch (err) {
        console.error('Failed to convert HEIC image:', err);
        setImageError(true);
        onError?.();
      }
    };

    handleHeicImage();
  }, [src, convertHeicToJpeg, onError]);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  const handleImageLoad = () => {
    onLoad?.();
  };

  if (isConverting) {
    return (
      <div className={`flex items-center justify-center  ${className}`}>
        <div className="flex flex-col items-center gap-2 p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          <p className="text-sm text-gray-500">Converting image...</p>
        </div>
      </div>
    );
  }

  if (imageError || error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="flex flex-col items-center gap-2 p-4">
          <div className="text-gray-400">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Failed to load image</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};
