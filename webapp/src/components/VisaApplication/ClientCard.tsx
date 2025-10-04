import { useState, useEffect } from 'react';

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { ImageViewer } from '../ui/image-viewer';

import { Crown, User, Mail, Check, Copy, Phone, File, Eye, Download, Image } from 'lucide-react';

import { ContactMethodIcon } from '../ContactMethod';

import { formatCurrency } from '@/utils/currency';
import { cn } from '@/lib/utils';

const ClientCard = ({
  application,
  order,
  border,
}: {
  application: any;
  order?: any;
  border?: string;
}) => {
  const { orderItem } = application;
  const { client } = orderItem;

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  const handleCopyToClipboard = (text: string, event: React.MouseEvent, contactId: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedContact(contactId);
  };

  useEffect(() => {
    if (copiedContact) {
      const timer = setTimeout(() => {
        setCopiedContact(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedContact]);

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.heic'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const getFullFileUrl = (fileUrl: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // If it's an S3 URL, convert it to use backend file endpoint
    if (fileUrl.includes('storage.yandexcloud.net/')) {
      // Extract the file path after bucket name
      const parts = fileUrl.split('storage.yandexcloud.net/')[1];
      if (parts) {
        // Remove bucket name from path: bucket/folder/file -> folder/file
        const filePath = parts.split('/').slice(1).join('/');
        return `${baseUrl}/upload/file/${filePath}`;
      }
    }

    // For legacy local paths, prepend the API base URL
    if (fileUrl.startsWith('/')) {
      return `${baseUrl}${fileUrl}`;
    }

    // Return as-is for other cases
    return fileUrl;
  };

  const handleViewDocument = (document: any) => {
    setViewingDocument(document);
    setViewModalOpen(true);
  };

  const handleDownloadDocument = async (doc: any, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      const fullUrl = getFullFileUrl(doc.fileUrl);

      // Check if File System Access API is supported
      if ('showSaveFilePicker' in window) {
        // Modern approach with Save As dialog
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to download file');
        }

        const blob = await response.blob();

        // Show save file picker
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: doc.originalName || 'document',
          types: [
            {
              description: 'Files',
              accept: {
                '*/*': [getFileExtension(doc.originalName)],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to traditional download
        await downloadWithBlob(doc, fullUrl);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Final fallback: open in new tab
      window.open(getFullFileUrl(doc.fileUrl), '_blank');
    }
  };

  const downloadWithBlob = async (doc: any, fullUrl: string) => {
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = doc.originalName || 'document';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const getFileExtension = (filename: string) => {
    const ext = filename?.split('.').pop();
    return ext ? `.${ext}` : '';
  };

  return (
    <Card
      className={cn(
        'p-6 bg-secondary',
        order?.status === 'submitted' && !border ? 'border-success' : `${border}`
      )}
    >
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          {client.isPrimary && (
            <div className="flex gap-1">
              <Badge variant="primary">
                <Crown />
                <span>
                  {client.lastName || ''} {client.firstName || ''}
                </span>
              </Badge>
            </div>
          )}
          {!client.isPrimary && (
            <div className="flex gap-1">
              <Badge variant="primary">
                <Crown />
              </Badge>
              <Badge variant="secondary">
                <User />
                {client.lastName || ''} {client.firstName || ''}
              </Badge>
            </div>
          )}
        </div>
        <div
          className={cn('flex items-center gap-1', order?.status === 'submitted' && 'text-success')}
        >
          {order?.status === 'submitted' && <Check className="text-success w-4 h-4" />}
          {formatCurrency(orderItem.finalPrice, 'VND')}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {client.citizenship && (
          <Badge variant="secondary" className="bg-muted">
            {client.citizenship?.name} ({client.citizenship?.abbreviation})
          </Badge>
        )}

        {client.user?.contactMethods?.map((contact: any) => (
          <Badge
            key={contact.id}
            variant="secondary"
            className={`flex gap-1 items-center cursor-pointer transition-all duration-300 ${
              copiedContact === contact.id
                ? 'bg-green-500/20 text-green-300'
                : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={e => handleCopyToClipboard(contact.value, e, contact.id)}
          >
            <ContactMethodIcon method={contact.method} className="w-4 h-4" />
            {` ${contact.value}`}
            {copiedContact === contact.id ? (
              <Check className="w-4 h-4 animate-pulse" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Badge>
        ))}
        {client.user?.phoneNumber && (
          <Badge
            variant="secondary"
            className={`flex gap-1 items-center cursor-pointer transition-all duration-300 ${
              copiedContact === 'phoneNumber'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={e =>
              client.user?.phoneNumber &&
              handleCopyToClipboard(client.user.phoneNumber, e, 'phoneNumber')
            }
          >
            <Phone className="w-4 h-4" />
            {client.user.phoneNumber}
            {copiedContact === 'phoneNumber' ? (
              <Check className="w-4 h-4 animate-pulse" />
            ) : (
              <Copy className="w-4 h-4 " />
            )}
          </Badge>
        )}
        {client.user?.email && (
          <Badge
            variant="secondary"
            className={`flex gap-1 items-center cursor-pointer transition-all duration-300 ${
              copiedContact === 'email'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-muted hover:bg-muted/80'
            }`}
            onClick={e =>
              client.user?.email && handleCopyToClipboard(client.user.email, e, 'email')
            }
          >
            <Mail className="w-4 h-4" />
            {client.user.email}
            {copiedContact === 'email' ? (
              <Check className="w-4 h-4 animate-pulse" />
            ) : (
              <Copy className="w-4 h-4 " />
            )}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div key={`${application.id}-visa-data`} className="md:flex flex-col items-center">
          <Badge variant="accent" className="rounded-b-none md:rounded-r-none  w-full">
            Visa - {application.country.name} - {application.visaType.name}
          </Badge>
          <Badge variant="secondary" className="rounded-t-none md:rounded-l-none w-full">
            {new Date(application.plannedCountryEntryDate).toLocaleDateString()} -{' '}
            {new Date(application.plannedCountryEntryDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Badge>
        </div>
      </div>

      {client.documents.length > 0 && (
        <>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-3">
            {client.documents.map((document: any) => (
              <Card key={document.id} className="bg-secondary p-3 rounded-md">
                {/* Show existing document */}
                <div className="flex items-center gap-2">
                  {document.originalName.toLowerCase().includes('.heic') ||
                  document.originalName.toLowerCase().includes('.heif') ? (
                    <div className="flex items-center justify-center border-dashed rounded-md p-2">
                      <Image className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : isImageFile(document.originalName) ? (
                    <div className="flex items-center justify-center border-dashed rounded-md">
                      <img
                        src={getFullFileUrl(document.fileUrl)}
                        alt={document.originalName}
                        className="max-w-full max-h-8 object-contain rounded"
                        onError={() => {
                          console.error('Image failed to load:', document.fileUrl);
                          console.error('Full URL:', getFullFileUrl(document.fileUrl));
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
                      onClick={() => handleViewDocument(document)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={e => handleDownloadDocument(document, e)}
                    >
                      {document.requirement?.title} <Download />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
        </>
      )}
    </Card>
  );
};

export default ClientCard;
