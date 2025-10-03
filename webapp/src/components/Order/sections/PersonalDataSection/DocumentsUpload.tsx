import React, { useState, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import useOrderStore, { StoreClient } from '@/stores/order/order-store';
import { FileUpload } from '@/components/ui/file-upload';
import { ImageViewer } from '@/components/ui/image-viewer';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Trash2, Replace, File, Image } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

interface DocumentsUploadProps {
  requirements: any[];
  client: StoreClient;
}

interface PendingUpload {
  filePath: string;
  fileInfo: {
    fileName?: string;
    originalName: string;
    size: number;
    mimetype?: string;
  };
}

const DocumentsUpload: React.FC<DocumentsUploadProps> = ({ requirements, client }) => {
  const [uploadingRequirements, setUploadingRequirements] = useState<Set<string>>(new Set());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const replaceInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const { setClients } = useOrderStore();

  // Get existing client documents
  const { data: existingDocuments, refetch: refetchDocuments } =
    trpc.clientDocument.getAll.useQuery({
      clientId: client.id,
    });

  // Helper function to transform document response to store format
  const transformDocumentForStore = useCallback(
    (docResponse: any) => ({
      id: docResponse.id,
      clientId: docResponse.clientId,
      requirementId: docResponse.requirementId,
      fileName: docResponse.fileName,
      originalName: docResponse.originalName,
      fileUrl: docResponse.fileUrl,
      fileType: docResponse.fileType,
      fileSize: docResponse.fileSize,
      uploadedAt: docResponse.uploadedAt,
      uploadedById: docResponse.uploadedById,
      isValid: docResponse.isValid,
      expiresAt: docResponse.expiresAt,
      tags: docResponse.tags,
      comment: docResponse.comment,
      reviewedAt: docResponse.reviewedAt || null,
      reviewedById: docResponse.reviewedById || null,
    }),
    []
  );

  // Create client document mutation
  const createDocumentMutation = trpc.clientDocument.create.useMutation({
    onSuccess: async () => {
      // Refetch documents data
      const updatedData = await refetchDocuments();

      // Update order store with new documents
      if (updatedData.data?.clientDocuments) {
        const transformedDocuments =
          updatedData.data.clientDocuments.map(transformDocumentForStore);
        const currentClients = useOrderStore.getState().clients;
        setClients(
          currentClients.map(c =>
            c.id === client.id ? { ...c, documents: transformedDocuments } : c
          )
        );
      }

      toast.success('Document uploaded successfully');
    },
    onError: error => {
      toast.error(`Failed to save document: ${error.message}`);
    },
    onSettled: () => {
      setUploadingRequirements(new Set());
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = trpc.clientDocument.delete.useMutation({
    onSuccess: async () => {
      // Refetch documents data
      const updatedData = await refetchDocuments();

      // Update order store with updated documents
      if (updatedData.data?.clientDocuments) {
        const transformedDocuments =
          updatedData.data.clientDocuments.map(transformDocumentForStore);
        const currentClients = useOrderStore.getState().clients;
        setClients(
          currentClients.map(c =>
            c.id === client.id ? { ...c, documents: transformedDocuments } : c
          )
        );
      }

      toast.success('Document deleted successfully');
    },
    onError: error => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const generateFileName = useCallback(
    (requirement: any, originalName: string) => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const extension = originalName.split('.').pop() || '';
      const requirementName = requirement.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      return `${requirementName}-${client.lastName}-${client.firstName}-${dateStr}.${extension}`.toLowerCase();
    },
    [client.firstName, client.lastName]
  );

  const createFileUploadHandlers = useCallback(
    (requirementId: string) => {
      const requirement = requirements.find(req => req.id === requirementId);
      if (!requirement) {
        throw new Error(`Requirement not found: ${requirementId}`);
      }

      return {
        onChange: () => {
          // File path change handling - not needed for current implementation
        },
        onUploadSuccess: (fileInfo: PendingUpload['fileInfo']) => {
          const newFileName =
            fileInfo.fileName || generateFileName(requirement, fileInfo.originalName);

          // Trigger document creation
          setUploadingRequirements(current => new Set(current.add(requirementId)));

          createDocumentMutation.mutate({
            clientId: client.id,
            requirementId: requirementId,
            fileName: newFileName,
            originalName: newFileName,
            fileUrl: `/uploads/client-documents/${newFileName}`,
            fileType: fileInfo.mimetype?.split('/')[1] || 'unknown',
            fileSize: fileInfo.size,
          });
        },
      };
    },
    [client.id, createDocumentMutation, requirements, generateFileName]
  );

  const handleDeleteDocument = useCallback(
    (documentId: string) => {
      deleteDocumentMutation.mutate({ id: documentId });
    },
    [deleteDocumentMutation]
  );

  const getExistingDocument = (requirementId: string) => {
    const doc = existingDocuments?.clientDocuments?.find(
      (doc: any) => doc.requirementId === requirementId
    );
    return doc;
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getFullFileUrl = (fileUrl: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return fileUrl.startsWith('/') ? `${baseUrl}${fileUrl}` : fileUrl;
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setViewModalOpen(true);
  };

  const handleReplaceClick = (requirementId: string) => {
    const input = replaceInputRefs.current[requirementId];
    if (input) {
      input.click();
    }
  };

  const handleReplaceFileSelect = async (requirementId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const requirement = requirements.find(req => req.id === requirementId);
    if (!requirement) return;

    // Find existing document to replace
    const existingDoc = getExistingDocument(requirementId);
    if (!existingDoc) {
      toast.error('No existing document found to replace');
      return;
    }

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.heic'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast.error('File type not supported. Accepted types: PDF, DOC, DOCX, JPG, PNG, HEIC');
      return;
    }

    // Upload file
    setUploadingRequirements(current => new Set(current.add(requirementId)));

    try {
      const formData = new FormData();
      formData.append('document', file);

      const newFileName = generateFileName(requirement, file.name);
      formData.append('customFileName', newFileName);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/client-document`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Use the filename returned by backend (handles conversion automatically)
        const finalFileName = result.fileName || newFileName;

        // First delete the old document
        await new Promise<void>((resolve, reject) => {
          deleteDocumentMutation.mutate(
            { id: existingDoc.id },
            {
              onSuccess: () => resolve(),
              onError: error => reject(error),
            }
          );
        });

        // Then create the new document
        createDocumentMutation.mutate({
          clientId: client.id,
          requirementId: requirementId,
          fileName: finalFileName,
          originalName: finalFileName,
          fileUrl: `/uploads/client-documents/${finalFileName}`,
          fileType: result.mimetype?.split('/')[1] || file.type.split('/')[1] || 'unknown',
          fileSize: result.size || file.size,
        });
      } else {
        toast.error(result.error || 'Upload failed');
        setUploadingRequirements(current => {
          const newSet = new Set(current);
          newSet.delete(requirementId);
          return newSet;
        });
      }
    } catch {
      toast.error('Failed to replace document. Please try again.');
      setUploadingRequirements(current => {
        const newSet = new Set(current);
        newSet.delete(requirementId);
        return newSet;
      });
    }
  };

  // Filter and sort requirements that need file uploads (document type)
  // Sort so required fields (isOptional = false) come first, then optional fields
  const fileUploadRequirements = requirements
    .filter(req => req.inputType === 'document')
    .sort((a, b) => {
      // Required fields (isOptional = false) come first
      if (a.isOptional === false && b.isOptional === true) return -1;
      if (a.isOptional === true && b.isOptional === false) return 1;
      return 0;
    });

  if (fileUploadRequirements.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No document requirements</p>
            <p className="text-sm">This service doesn't require any document uploads.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 2xl:grid-cols-4 xl:grid-cols-3 gap-6 items-start">
        {fileUploadRequirements.map(requirement => {
          const existingDoc = getExistingDocument(requirement.id);
          const isUploading = uploadingRequirements.has(requirement.id);
          const hasDocument = !!existingDoc;
          const handlers = createFileUploadHandlers(requirement.id);

          return (
            <div key={requirement.id} className="grid gap-2 items-start">
              <span>
                {requirement.title}
                {!requirement.isOptional && <span className="text-red-500 ml-1">*</span>}
              </span>
              {hasDocument ? (
                <Card className="bg-secondary p-3 rounded-md">
                  {/* Show existing document */}
                  <div className="flex items-center justify-between gap-2">
                    {existingDoc.originalName.toLowerCase().includes('.heic') ||
                    existingDoc.originalName.toLowerCase().includes('.heif') ? (
                      <div className="flex items-center justify-center border-dashed rounded-md p-2">
                        <Image className="w-4 h-4 text-gray-400" />
                      </div>
                    ) : isImageFile(existingDoc.originalName) ? (
                      <div className="flex items-center justify-center border-dashed rounded-md">
                        <img
                          src={getFullFileUrl(existingDoc.fileUrl)}
                          alt={existingDoc.originalName}
                          className="max-w-full max-h-8 object-contain rounded"
                          onError={() => {
                            console.error('Image failed to load:', existingDoc.fileUrl);
                            console.error('Full URL:', getFullFileUrl(existingDoc.fileUrl));
                          }}
                        />
                      </div>
                    ) : (
                      <File className="w-6 h-6" />
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDocument(existingDoc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReplaceClick(requirement.id)}
                        disabled={isUploading || createDocumentMutation.isPending}
                      >
                        <Replace className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteDocument(existingDoc.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Hidden file input for replace functionality */}
                  <input
                    ref={el => {
                      replaceInputRefs.current[requirement.id] = el;
                    }}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
                    onChange={e => handleReplaceFileSelect(requirement.id, e.target.files)}
                    className="hidden"
                    disabled={isUploading || createDocumentMutation.isPending}
                  />
                </Card>
              ) : (
                /* Upload new document */
                <FileUpload
                  onChange={handlers.onChange}
                  uploadEndpoint="/upload/client-document"
                  fileFieldName="document"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.heic"
                  maxSize={10 * 1024 * 1024} // 10MB
                  placeholder={`Drag or click to browse`}
                  customFileName={`${requirement.title.replace(/[^a-zA-Z0-9]/g, '-')}-${client.lastName}-${client.firstName}-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`.toLowerCase()}
                  onUploadSuccess={handlers.onUploadSuccess}
                  disabled={isUploading || createDocumentMutation.isPending}
                  className="bg-secondary"
                />
              )}

              {isUploading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm mt-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving document...</span>
                </div>
              )}
            </div>
          );
        })}
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
                      console.error('Modal image failed to load:', viewingDocument.fileUrl);
                      console.error('Full URL:', getFullFileUrl(viewingDocument.fileUrl));
                    }}
                  />
                ) : (
                  <div className="w-full h-[70vh]">
                    <iframe
                      src={getFullFileUrl(viewingDocument.fileUrl)}
                      className="w-full h-full border rounded"
                      title={viewingDocument.originalName}
                      onError={() => {
                        console.error('Failed to load:', viewingDocument.fileUrl);
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
    </div>
  );
};

export default DocumentsUpload;
