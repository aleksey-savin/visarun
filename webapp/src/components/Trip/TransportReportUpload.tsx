import { useState } from 'react';
import { FileUpload } from '@/components/ui/file-upload';
import { trpc } from '@/lib/trpc';
import { createDocumentFromFileUrl } from '@/utils/fileUtils';

interface TripTransport {
  id: string;
  reportUrl: string | null;
}

interface TransportReportUploadProps {
  tripTransport: TripTransport;
  onUploadStart?: (tripTransportId: string) => void;
  onUploadEnd?: (tripTransportId: string) => void;
  disabled?: boolean;
}

const TransportReportUpload = ({
  tripTransport,
  onUploadStart,
  onUploadEnd,
  disabled = false,
}: TransportReportUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const utils = trpc.useContext();

  const editTripTransportMutation = trpc.visarunTripTransport.edit.useMutation({
    onSuccess: () => {
      // Refetch trip transports to update the UI
      utils.visarunTripTransport.getByTripIds.invalidate();
    },
    onError: error => {
      console.error('Failed to update transport:', error.message);
    },
  });

  const getReportDocumentUrl = (tripTransport: TripTransport) => {
    return tripTransport?.reportUrl
      ? createDocumentFromFileUrl(tripTransport.id, tripTransport.reportUrl, 'transport-reports')
      : null;
  };

  const handleReportUploadSuccess = async (
    tripTransportId: string,
    response: { fileUrl?: string }
  ) => {
    if (!response.fileUrl) {
      console.error('No fileUrl in upload response');
      return;
    }

    const fileUrl = response.fileUrl;

    try {
      await editTripTransportMutation.mutateAsync({
        id: tripTransportId,
        reportUrl: fileUrl,
      });

      // Refetch trip transports to update the UI
      utils.visarunTripTransport.getByTripIds.invalidate();
    } catch (error) {
      console.error('Failed to update transport report:', error);
    }
  };

  const handleReplaceReportFile = async (tripTransportId: string, file: File) => {
    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('File size must be less than 10MB');
      return;
    }

    const acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.heic'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      console.error('File type not supported. Accepted types: PDF, DOC, DOCX, JPG, PNG, HEIC');
      return;
    }

    setIsUploading(true);
    onUploadStart?.(tripTransportId);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('tripTransportId', tripTransportId);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/transport-reports`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const fileUrl = result.filePath;

      // Update transport with new report URL
      await editTripTransportMutation.mutateAsync({
        id: tripTransportId,
        reportUrl: fileUrl,
      });

      // Refetch trip transports to update the UI
      utils.visarunTripTransport.getByTripIds.invalidate();
    } catch (error) {
      console.error('Failed to replace report document:', error);
    } finally {
      setIsUploading(false);
      onUploadEnd?.(tripTransportId);
    }
  };

  const handleDeleteReport = async (tripTransportId: string) => {
    try {
      // Remove report URL from transport
      await editTripTransportMutation.mutateAsync({
        id: tripTransportId,
        reportUrl: null,
      });

      // Refetch trip transports to update the UI
      utils.visarunTripTransport.getByTripIds.invalidate();
    } catch (error) {
      console.error('Failed to delete report document:', error);
    }
  };

  return (
    <div className="space-y-2">
      <FileUpload
        onChange={filePath => {
          if (filePath) {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = {
              fileUrl: filePath.startsWith('http') ? filePath : `${baseUrl}${filePath}`,
            };
            void handleReportUploadSuccess(tripTransport.id, response);
          }
        }}
        value={getReportDocumentUrl(tripTransport) || ''}
        handleReplaceFileSelect={(file: File) => handleReplaceReportFile(tripTransport.id, file)}
        handleDeleteDocument={() => handleDeleteReport(tripTransport.id)}
        uploadEndpoint="/upload/transport-reports"
        fileFieldName="document"
        placeholder="Upload transport report"
        disabled={disabled || isUploading}
      />
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
          <span>Uploading report...</span>
        </div>
      )}
    </div>
  );
};

export default TransportReportUpload;
