import { useMutation } from '@tanstack/react-query';

export interface UploadResponse {
  success: boolean;
  filePath: string;
  fileName: string;
  originalName: string;
  size: number;
  mimetype: string;
  error?: string;
}

export interface DocumentUploadParams {
  file: File;
  clientId?: string;
  requirementId?: string;
  orderId?: string;
}

export const useUploadClientDocument = () => {
  return useMutation({
    mutationFn: async ({
      file,
      clientId,
      requirementId,
    }: DocumentUploadParams): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('document', file);

      if (clientId) {
        formData.append('clientId', clientId);
      }

      if (requirementId) {
        formData.append('requirementId', requirementId);
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/client-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json() as Promise<UploadResponse>;
    },
  });
};

export const useUploadPaymentDocument = () => {
  return useMutation({
    mutationFn: async ({
      file,
      orderId,
      clientId,
    }: DocumentUploadParams): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('document', file);

      if (orderId) {
        formData.append('orderId', orderId);
      }

      if (clientId) {
        formData.append('clientId', clientId);
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/payment-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json() as Promise<UploadResponse>;
    },
  });
};

export const useUploadRequirementDocument = () => {
  return useMutation({
    mutationFn: async ({ file, requirementId }: DocumentUploadParams): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('document', file);

      if (requirementId) {
        formData.append('requirementId', requirementId);
      }

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/upload/requirement-document`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json() as Promise<UploadResponse>;
    },
  });
};
