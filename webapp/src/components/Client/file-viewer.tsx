import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Download, Eye, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface FileViewerProps {
  filePath: string;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FileViewer = ({ filePath, fileName, isOpen, onClose }: FileViewerProps) => {
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle S3 URLs vs legacy local URLs
  const fileUrl = filePath.includes('storage.yandexcloud.net/')
    ? filePath // S3 URL - use directly
    : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${filePath}`; // Legacy local URL
  const isPDF = filePath.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName || filePath.split('/').pop() || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    console.error('Image failed to load:', fileUrl);
    setIsLoading(false);
    setError(`Failed to load image: ${fileUrl}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-lg font-semibold truncate">
            {fileName || filePath.split('/').pop()}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button variant="secondary" size="sm" onClick={handleZoomOut} disabled={zoom <= 50}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[3rem] text-center">{zoom}%</span>
                <Button variant="secondary" size="sm" onClick={handleZoomIn} disabled={zoom >= 200}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={resetZoom}>
                  Reset
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          {isPDF ? (
            <div className="w-full h-full min-h-[600px]">
              <iframe
                src={fileUrl}
                className="w-full h-full border rounded-lg"
                title={fileName || 'PDF Document'}
                onLoad={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading PDF...</span>
                </div>
              )}
            </div>
          ) : isImage ? (
            <div className="flex justify-center items-center min-h-[400px]">
              {isLoading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Loading image...</span>
                </div>
              )}
              {error && (
                <div className="text-center text-red-600">
                  <p className="mb-2">{error}</p>
                  <p className="text-sm text-gray-500 mb-4">URL: {fileUrl}</p>
                  <Button
                    variant="secondary"
                    onClick={() => window.open(fileUrl, '_blank')}
                    className="mt-2"
                  >
                    Open in new tab
                  </Button>
                </div>
              )}
              <img
                src={fileUrl}
                alt={fileName || 'Document'}
                className={`max-w-full h-auto rounded-lg shadow-lg transition-transform ${
                  isLoading ? 'hidden' : 'block'
                }`}
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center top',
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Eye className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg mb-2">Preview not available</p>
              <p className="text-sm mb-4">This file type cannot be previewed in the browser.</p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
