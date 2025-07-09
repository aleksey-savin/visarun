import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Upload, FileText, X, AlertCircle, Loader2, Tag, Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { useUploadClientDocument, useCreateClientDocument } from '../../hooks/useClientDocuments';

interface ClientDocumentUploadProps {
  clientId: string;
  requirementId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (document: {
    id: string;
    fileName: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: Date | string;
    comment?: string | null;
    expiresAt?: Date | string | null;
    tags: string[];
    client: { id: string; firstName: string; lastName: string };
    requirement?: { id: string; title: string } | null;
  }) => void;
}

const allowedFileTypes = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ClientDocumentUpload: React.FC<ClientDocumentUploadProps> = ({
  clientId,
  requirementId,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    comment: '',
    tags: [] as string[],
    expiresAt: undefined as Date | undefined,
    newTag: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadMutation = useUploadClientDocument();
  const createDocumentMutation = useCreateClientDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!Object.keys(allowedFileTypes).includes(file.type)) {
        setUploadError('Invalid file type. Only PDF, JPG, PNG, DOC, and DOCX files are allowed.');
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes,
    maxFiles: 1,
    multiple: false,
  });

  const handleAddTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: '',
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload file
      setUploadProgress(50);
      const uploadResult = await uploadMutation.mutateAsync(selectedFile);

      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      // Create document record
      setUploadProgress(75);
      const documentResult = await createDocumentMutation.mutateAsync({
        clientId,
        requirementId,
        fileName: uploadResult.fileName,
        originalName: selectedFile.name,
        fileUrl: uploadResult.filePath,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        expiresAt: formData.expiresAt,
        tags: formData.tags,
        comment: formData.comment || undefined,
      });

      setUploadProgress(100);

      // Reset form
      setSelectedFile(null);
      setFormData({
        comment: '',
        tags: [],
        expiresAt: undefined,
        newTag: '',
      });
      setUploadProgress(0);

      if (onSuccess) {
        // Pass the document to the success handler
        const clientDoc = documentResult.clientDocument;
        onSuccess(clientDoc);
      }

      onOpenChange(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({
      comment: '',
      tags: [],
      expiresAt: undefined,
      newTag: '',
    });
    setUploadError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Client Document</DialogTitle>
          <DialogDescription>
            Upload a document for the client. Supported formats: PDF, JPG, PNG, DOC, DOCX (max 10MB)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">File Upload</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or click to select a file</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC, DOCX • Max 10MB</p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 h-8 w-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="mt-4">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-sm text-gray-500 mt-2">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Add a comment or description for this document..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt ? format(formData.expiresAt, 'yyyy-MM-dd') : ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      expiresAt: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.newTag}
                    onChange={e => setFormData({ ...formData, newTag: e.target.value })}
                    placeholder="Add a tag..."
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!formData.newTag.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-auto p-0"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={!selectedFile || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
