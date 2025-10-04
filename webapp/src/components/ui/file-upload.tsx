import React, { useState, useRef } from 'react';
import { Button } from './button';

import { Label } from './label';
import { Card, CardContent } from './card';
import { Dialog, DialogContent } from './dialog';
import { ImageViewer } from '@/components/ui/image-viewer';

import { Upload, AlertCircle, Loader2, FileX, File, Eye, Replace, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFullFileUrl, isImageFile } from '@/utils/fileUtils';

interface FileUploadProps {
  value?: string | { id: string; originalName: string; fileUrl: string };
  imageLoadErrors?: Set<string>;
  setImageLoadErrors?: (errors: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  handleReplaceFileSelect?:
    | ((requirementId: string, files: FileList | null) => Promise<void>)
    | ((file: File) => Promise<void>);
  handleDeleteDocument?: (documentId: string) => Promise<void>;
  onChange: (filePath: string | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  uploadEndpoint: string; // e.g., '/api/upload/requirement-document'
  fileFieldName?: string; // e.g., 'document'
  customData?: Record<string, string>; // custom data to send to server (clientId, requirementId, etc.)

  onUploadSuccess?: (
    fileInfo: {
      fileName?: string;
      originalName: string;
      size: number;
      mimetype?: string;
    },
    filePath?: string
  ) => void;
}

interface UploadResponse {
  success: boolean;
  filePath?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  mimetype?: string;
  error?: string;
  message?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  imageLoadErrors,
  setImageLoadErrors,
  handleReplaceFileSelect,
  handleDeleteDocument,
  onChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.heic',
  maxSize = 10 * 1024 * 1024, // 10MB
  label,
  description,
  disabled = false,
  className,
  placeholder = 'Click to upload or drag and drop',
  uploadEndpoint,
  fileFieldName = 'document',
  customData,
  onUploadSuccess,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);

  // Extract file info from existing path
  const getFileInfoFromPath = (path: string) => {
    const filename = path.split('/').pop() || '';
    const extension = filename.split('.').pop() || '';
    const mimeType = extension.includes('pdf')
      ? 'application/pdf'
      : extension.includes('doc')
        ? 'application/msword'
        : extension.includes('jpg') || extension.includes('jpeg')
          ? 'image/jpeg'
          : extension.includes('png')
            ? 'image/png'
            : 'application/octet-stream';

    return {
      name: filename,
      size: 0, // Unknown size for existing files
      type: mimeType,
    };
  };

  // Check if we have an existing file path (S3 URL or legacy local URL)
  React.useEffect(() => {
    console.log(value);
    if (
      value &&
      typeof value === 'object' &&
      (value.fileUrl.startsWith('/uploads/') || value.fileUrl.includes('storage.yandexcloud.net/'))
    ) {
      setUploadedFile(getFileInfoFromPath(value.fileUrl));
    } else if (!value) {
      setUploadedFile(null);
    }
  }, [value]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;

      const isValidExtension = acceptedTypes.some(type =>
        type.startsWith('.') ? type === fileExtension : type === mimeType
      );

      if (!isValidExtension) {
        return `File type not supported. Accepted types: ${accept}`;
      }
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append(fileFieldName, file);

      // Add custom data if provided
      if (customData) {
        Object.entries(customData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = uploadEndpoint.startsWith('/')
        ? `${baseUrl}${uploadEndpoint}`
        : uploadEndpoint;

      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: UploadResponse = await response.json();
      console.log('Upload response:', result);

      if (result.success && result.filePath) {
        const uploadedFileInfo = {
          name: result.originalName || file.name,
          size: result.size || file.size,
          type: result.mimetype || file.type,
        };

        setUploadedFile(uploadedFileInfo);
        onChange(result.filePath); // This now contains S3 URL

        if (onUploadSuccess) {
          onUploadSuccess(
            {
              fileName: result.fileName,
              originalName: result.originalName || file.name,
              size: result.size || file.size,
              mimetype: result.mimetype || file.type,
            },
            result.filePath
          );
        }
      } else {
        setUploadError(result.error || result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    uploadFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const hasFile = value && uploadedFile;

  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    id: string;
    originalName: string;
    fileUrl: string;
  } | null>(null);

  const handleViewDocument = (document: { id: string; originalName: string; fileUrl: string }) => {
    setViewingDocument(document);
    setViewModalOpen(true);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={e => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {hasFile ? (
          <Card className="bg-secondary p-3 rounded-md">
            <div className="flex items-center justify-between gap-2">
              {value && typeof value === 'object' && isImageFile(value.originalName) ? (
                <div className="flex items-center justify-center border-dashed rounded-md">
                  {imageLoadErrors?.has(value.fileUrl) ? (
                    <FileX className="w-6 h-6 text-destructive" />
                  ) : (
                    <img
                      src={getFullFileUrl(value.fileUrl)}
                      alt=""
                      className="max-w-full max-h-8 object-contain rounded"
                      onError={() => {
                        console.error('Image failed to load:', getFullFileUrl(value.fileUrl));
                        setImageLoadErrors?.((prev: Set<string>) =>
                          new Set(prev).add(value.fileUrl)
                        );
                      }}
                    />
                  )}
                </div>
              ) : (
                <File className="w-6 h-6" />
              )}
              <div className="flex items-center gap-2">
                {typeof value === 'object' && !imageLoadErrors?.has(value.fileUrl) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => value && handleViewDocument(value)}
                    disabled={isUploading}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => replaceInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Replace className="w-4 h-4" />
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleDeleteDocument &&
                    typeof value === 'object' &&
                    handleDeleteDocument(value.id)
                  }
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hidden file input for replace functionality */}
            <input
              ref={replaceInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
              onChange={e => {
                if (e.target.files && e.target.files.length > 0 && handleReplaceFileSelect) {
                  // Check function signature by parameter count
                  if (handleReplaceFileSelect.length === 2 && customData?.requirementId) {
                    // Two parameter version: (requirementId: string, files: FileList | null)
                    (
                      handleReplaceFileSelect as (
                        requirementId: string,
                        files: FileList | null
                      ) => Promise<void>
                    )(customData.requirementId, e.target.files);
                  } else if (handleReplaceFileSelect.length === 1) {
                    // Single parameter version: (file: File)
                    (handleReplaceFileSelect as (file: File) => Promise<void>)(e.target.files[0]);
                  }
                }
              }}
              className="hidden"
            />
          </Card>
        ) : (
          <Card
            className={cn(
              'bg-secondary rounded-md transition-colors cursor-pointer',
              dragActive ? 'bg-accent' : '',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <CardContent className="p-5">
              <div className="flex flex-col items-center justify-center space-y-2">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin " />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 " />
                    <div className="text-center">
                      <p className="text-sm text-gray-600">{placeholder}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Max size: {formatFileSize(maxSize)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* View Document Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="overflow-auto">
          <div className="flex items-center justify-center p-4">
            {viewingDocument && (
              <>
                {isImageFile(viewingDocument.originalName) ? (
                  <ImageViewer
                    src={getFullFileUrl(viewingDocument.fileUrl)}
                    alt={viewingDocument.originalName}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={() => {
                      console.error(
                        'Modal image failed to load:',
                        getFullFileUrl(viewingDocument.fileUrl)
                      );
                    }}
                  />
                ) : (
                  <div className="w-full h-[70vh]">
                    <iframe
                      src={getFullFileUrl(viewingDocument.fileUrl)}
                      className="w-full h-full border rounded"
                      title={viewingDocument.originalName}
                      onError={() => {
                        console.error('Failed to load:', getFullFileUrl(viewingDocument.fileUrl));
                        console.error('Full URL:', getFullFileUrl(viewingDocument.fileUrl));
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {uploadError && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{uploadError}</span>
        </div>
      )}

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
};
