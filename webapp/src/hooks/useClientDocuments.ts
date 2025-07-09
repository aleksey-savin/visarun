import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '../lib/trpc';

export interface CreateClientDocumentData {
  clientId: string;
  requirementId?: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  expiresAt?: Date;
  tags?: string[];
  comment?: string;
}

export interface GetClientDocumentsFilters {
  limit?: number;
  offset?: number;
  clientId?: string;
  requirementId?: string;
  isValid?: boolean;
  search?: string;
  tags?: string[];
  fileType?: string;
}

export const useClientDocuments = (filters?: GetClientDocumentsFilters) => {
  return useQuery({
    queryKey: ['clientDocuments', filters],
    queryFn: () => trpcClient.clientDocument.getAll.query(filters || {}),
  });
};

export const useClientDocumentsByClient = (clientId: string) => {
  return useQuery({
    queryKey: ['clientDocuments', 'client', clientId],
    queryFn: () => trpcClient.clientDocument.getAll.query({ clientId }),
    enabled: !!clientId,
  });
};

export const useClientDocumentsByRequirement = (requirementId: string) => {
  return useQuery({
    queryKey: ['clientDocuments', 'requirement', requirementId],
    queryFn: () => trpcClient.clientDocument.getAll.query({ requirementId }),
    enabled: !!requirementId,
  });
};

export const useCreateClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDocumentData) => trpcClient.clientDocument.create.mutate(data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['clientDocuments'] });
      queryClient.invalidateQueries({
        queryKey: ['clientDocuments', 'client', (data as any).clientDocument.clientId],
      });
    },
  });
};

export const useDeleteClientDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.clientDocument.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientDocuments'] });
    },
  });
};

export const useUploadClientDocument = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch('/api/upload/client-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json() as Promise<{
        success: boolean;
        filePath: string;
        fileName: string;
        originalName: string;
        size: number;
        mimetype: string;
      }>;
    },
  });
};

export const useValidateClientDocumentUpload = () => {
  return useMutation({
    mutationFn: (filePath: string) =>
      trpcClient.upload.validateClientDocumentUpload.mutate({ filePath }),
  });
};
