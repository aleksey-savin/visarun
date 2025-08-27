import { useState } from 'react';
import { trpc } from '../../lib/trpcProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Edit, FileText, Plus, Trash2, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { FileViewer } from './file-viewer.js';
import { FileUpload } from '@/components/ui/file-upload';

interface ClientInfoProps {
  clientId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ClientInfo = ({ clientId, onEdit, onDelete }: ClientInfoProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);
  const [newDocumentPath, setNewDocumentPath] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);
  const [showInlineUpload, setShowInlineUpload] = useState(false);

  // Query to get client details
  const { data, error, isLoading, isError, refetch } = trpc.clientData.getOne.useQuery({
    id: clientId,
  });

  // Mutation to delete client
  const deleteClientMutation = trpc.clientData.delete.useMutation({
    onSuccess: () => {
      toast.success('Client profile deleted successfully');
      if (onDelete) {
        onDelete();
      }
    },
    onError: error => {
      toast.error('Failed to delete client profile', {
        description: error.message,
      });
    },
  });

  // Mutation to add document
  const addDocumentMutation = trpc.clientDocument.create.useMutation({
    onSuccess: () => {
      toast.success('Document added successfully');
      setShowInlineUpload(false);
      setNewDocumentPath(null);
      setUploadedFileInfo(null);
      refetch();
    },
    onError: error => {
      toast.error('Failed to add document', {
        description: error.message,
      });
    },
  });

  // Mutation to delete document
  const deleteDocumentMutation = trpc.clientDocument.delete.useMutation({
    onSuccess: () => {
      toast.success('Document deleted successfully');
      refetch();
    },
    onError: error => {
      toast.error('Failed to delete document', {
        description: error.message,
      });
    },
  });

  // Function to handle client deletion
  const handleDeleteClient = () => {
    deleteClientMutation.mutate({ id: clientId });
    setIsDeleteDialogOpen(false);
  };

  // Function to format dates
  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'PPP');
  };

  const handleViewFile = (filePath: string, fileName: string) => {
    setSelectedFile({ path: filePath, name: fileName });
    setFileViewerOpen(true);
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${filePath}`;
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleAddDocument = () => {
    if (!newDocumentPath || !uploadedFileInfo) {
      toast.error('Please upload a file first');
      return;
    }

    addDocumentMutation.mutate({
      clientId,
      fileName: uploadedFileInfo.fileName,
      originalName: uploadedFileInfo.originalName,
      fileUrl: newDocumentPath,
      fileType: uploadedFileInfo.fileType,
      fileSize: uploadedFileInfo.fileSize,
    });
  };

  const handleFileUpload = (filePath: string | null) => {
    setNewDocumentPath(filePath);
    if (!filePath) {
      setUploadedFileInfo(null);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    deleteDocumentMutation.mutate({ id: documentId });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error Loading Client</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.client) {
    return (
      <Card className="w-full border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-700">Client Not Found</CardTitle>
          <CardDescription>The client profile could not be found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const client = data.client;

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">
              {client.firstName} {client.lastName}
            </CardTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the client profile
                      and all associated documents.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleDeleteClient}>
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Account Owner</h3>
              <p className="text-sm">
                {client.user?.firstName} {client.user?.lastName}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Citizenship</h3>
              <p className="text-sm">
                {client.citizenship ? client.citizenship.name : 'Not specified'}
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Previous Violations</h3>
              <div className="flex items-center gap-2">
                <Badge variant={client.prevViolations ? 'destructive' : 'secondary'}>
                  {client.prevViolations ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {client.prevViolations && client.prevViolationsDesc && (
              <div className="space-y-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500">Violations Description</h3>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{client.prevViolationsDesc}</p>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500">Currently Outside Country</h3>
              <div className="flex items-center gap-2">
                <Badge variant={client.isOutsideTheCountry ? 'default' : 'secondary'}>
                  {client.isOutsideTheCountry ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            {client.isOutsideTheCountry && client.isOutsideTheCountryAt && (
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500">Left Country On</h3>
                <p className="text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {formatDate(client.isOutsideTheCountryAt)}
                </p>
              </div>
            )}
          </div>
          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Documents</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInlineUpload(!showInlineUpload)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </div>

            {showInlineUpload && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <FileUpload
                  value={newDocumentPath || undefined}
                  onChange={handleFileUpload}
                  uploadEndpoint="/upload/client-document"
                  fileFieldName="document"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSize={10 * 1024 * 1024} // 10MB
                  label="Document File"
                  description="Upload PDF, DOC, DOCX, JPG, JPEG, or PNG files up to 10MB"
                  onUploadSuccess={fileInfo => {
                    setUploadedFileInfo({
                      fileName: fileInfo.fileName || fileInfo.originalName,
                      originalName: fileInfo.originalName,
                      fileSize: fileInfo.size,
                      fileType: fileInfo.mimetype?.split('/')[1] || 'unknown',
                    });
                  }}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleAddDocument}
                    disabled={
                      !newDocumentPath || !uploadedFileInfo || addDocumentMutation.isPending
                    }
                    size="sm"
                  >
                    {addDocumentMutation.isPending ? 'Adding...' : 'Add Document'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowInlineUpload(false);
                      setNewDocumentPath(null);
                      setUploadedFileInfo(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {client.documents && client.documents.length > 0 ? (
              <div className="space-y-3">
                {client.documents.map(
                  (document: {
                    id: string;
                    fileName: string;
                    uploadedAt: string;
                    fileSize: number;
                    fileUrl: string;
                    expiresAt: string | null;
                    comment: string | null;
                    tags: string[];
                  }) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{document.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{formatDate(document.uploadedAt)}</span>
                            {document.fileSize > 0 && (
                              <span>• {Math.round(document.fileSize / 1024)}KB</span>
                            )}
                            {document.expiresAt && (
                              <span>• Expires: {formatDate(document.expiresAt)}</span>
                            )}
                          </div>
                          {document.comment && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {document.comment}
                            </p>
                          )}
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {document.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {document.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{document.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(document.fileUrl, document.fileName)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(document.fileUrl, document.fileName)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{document.fileName}"? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteDocument(document.id)}
                              >
                                Delete
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents added yet</p>
                <p className="text-xs">Click "Add Document" to upload the first document</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {selectedFile && (
        <FileViewer
          filePath={selectedFile.path}
          fileName={selectedFile.name}
          isOpen={fileViewerOpen}
          onClose={() => {
            setFileViewerOpen(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};
