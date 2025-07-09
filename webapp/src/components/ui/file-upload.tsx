import React, { useState, useRef } from 'react';
import { Button } from './button';

import { Label } from './label';
import { Card, CardContent } from './card';

import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value?: string;
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
  onUploadSuccess?: (fileInfo: {
    fileName?: string;
    originalName: string;
    size: number;
    mimetype?: string;
  }) => void;
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
  onChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024, // 10MB
  label,
  description,
  disabled = false,
  className,
  placeholder = 'Click to upload or drag and drop',
  uploadEndpoint,
  fileFieldName = 'document',
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

  // Check if we have an existing file path
  React.useEffect(() => {
    if (value && value.startsWith('/uploads/') && !uploadedFile) {
      setUploadedFile(getFileInfoFromPath(value));
    } else if (!value && uploadedFile) {
      setUploadedFile(null);
    }
  }, [value, uploadedFile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
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

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const fullUrl = uploadEndpoint.startsWith('/')
        ? `${baseUrl}${uploadEndpoint}`
        : uploadEndpoint;

      const response = await fetch(fullUrl, {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (result.success && result.filePath) {
        setUploadedFile({
          name: result.originalName || file.name,
          size: result.size || file.size,
          type: result.mimetype || file.type,
        });
        onChange(result.filePath);

        if (onUploadSuccess) {
          onUploadSuccess({
            fileName: result.fileName,
            originalName: result.originalName || file.name,
            size: result.size || file.size,
            mimetype: result.mimetype || file.type,
          });
        }
      } else {
        setUploadError(result.error || result.message || 'Upload failed');
      }
    } catch {
      setUploadError('Upload failed. Please try again.');
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

  const handleClear = () => {
    onChange(null);
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const hasFile = value && uploadedFile;

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
          <Card className="border-2 border-dashed border-green-300 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">{getFileIcon(uploadedFile.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {uploadedFile.size > 0 ? formatFileSize(uploadedFile.size) : 'Existing file'}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              'border-2 border-dashed transition-colors cursor-pointer',
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                {isUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
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
