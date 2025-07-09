import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '../lib/trpc';

export interface CreateServiceRequirementData {
  requirementId: string;
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  textValue?: string;
  dateValue?: Date;
  booleanValue?: boolean;
  checkpointValue?: string;
  documentId?: string;
  comment?: string;
}

export interface UpdateServiceRequirementData {
  id: string;
  status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  textValue?: string;
  dateValue?: Date;
  booleanValue?: boolean;
  checkpointValue?: string;
  documentId?: string;
  comment?: string;
}

export interface GetServiceRequirementsFilters {
  limit?: number;
  offset?: number;
  serviceType?: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId?: string;
  requirementId?: string;
  status?: 'pending' | 'submitted' | 'approved' | 'rejected' | 'needs_revision';
  clientId?: string;
}

export interface InitializeServiceRequirementsData {
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  clientId?: string;
  visaTypeId?: string;
  citizenshipId?: string;
}

export interface SubmitRequirementData {
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  requirementId: string;
  textValue?: string;
  dateValue?: Date;
  booleanValue?: boolean;
  checkpointValue?: string;
  documentId?: string;
  comment?: string;
}

export interface BulkSubmitRequirementsData {
  serviceType: 'visa_application' | 'visarun_order' | 'document_service';
  serviceId: string;
  submissions: {
    requirementId: string;
    textValue?: string;
    dateValue?: Date;
    booleanValue?: boolean;
    checkpointValue?: string;
    documentId?: string;
    comment?: string;
  }[];
}

export const useServiceRequirements = (filters?: GetServiceRequirementsFilters) => {
  return useQuery({
    queryKey: ['serviceRequirements', filters],
    queryFn: () => trpcClient.serviceRequirement.getAll.query(filters || {}),
  });
};

export const useServiceRequirementsForService = (
  serviceType: 'visa_application' | 'visarun_order' | 'document_service',
  serviceId: string
) => {
  return useQuery({
    queryKey: ['serviceRequirements', 'service', serviceType, serviceId],
    queryFn: () => trpcClient.serviceRequirement.getForService.query({ serviceType, serviceId }),
    enabled: !!serviceType && !!serviceId,
  });
};

export const useServiceReadiness = (
  serviceType: 'visa_application' | 'visarun_order' | 'document_service',
  serviceId: string
) => {
  return useQuery({
    queryKey: ['serviceRequirements', 'readiness', serviceType, serviceId],
    queryFn: () => trpcClient.serviceRequirement.checkReadiness.query({ serviceType, serviceId }),
    enabled: !!serviceType && !!serviceId,
  });
};

export const useAvailableDocuments = (clientId: string, requirementId: string) => {
  return useQuery({
    queryKey: ['serviceRequirements', 'availableDocuments', clientId, requirementId],
    queryFn: () =>
      trpcClient.serviceRequirement.getAvailableDocuments.query({ clientId, requirementId }),
    enabled: !!clientId && !!requirementId,
  });
};

export const useInitializeServiceRequirements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InitializeServiceRequirementsData) =>
      trpcClient.serviceRequirement.initialize.mutate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequirements'] });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'service', variables.serviceType, variables.serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'readiness', variables.serviceType, variables.serviceId],
      });
    },
  });
};

export const useCreateServiceRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequirementData) =>
      trpcClient.serviceRequirement.create.mutate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequirements'] });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'service', variables.serviceType, variables.serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'readiness', variables.serviceType, variables.serviceId],
      });
    },
  });
};

export const useUpdateServiceRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateServiceRequirementData) =>
      trpcClient.serviceRequirement.update.mutate(data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequirements'] });
      queryClient.invalidateQueries({
        queryKey: [
          'serviceRequirements',
          'service',
          (data as any).serviceRequirement.serviceType,
          (data as any).serviceRequirement.serviceId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          'serviceRequirements',
          'readiness',
          (data as any).serviceRequirement.serviceType,
          (data as any).serviceRequirement.serviceId,
        ],
      });
    },
  });
};

export const useSubmitRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitRequirementData) => trpcClient.serviceRequirement.submit.mutate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequirements'] });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'service', variables.serviceType, variables.serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'readiness', variables.serviceType, variables.serviceId],
      });
    },
  });
};

export const useBulkSubmitRequirements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkSubmitRequirementsData) =>
      trpcClient.serviceRequirement.bulkSubmit.mutate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceRequirements'] });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'service', variables.serviceType, variables.serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['serviceRequirements', 'readiness', variables.serviceType, variables.serviceId],
      });
    },
  });
};

export const useValidateServiceRequirementInput = () => {
  return useMutation({
    mutationFn: (data: {
      serviceType: 'visa_application' | 'visarun_order' | 'document_service';
      serviceId: string;
      requirementId: string;
      inputValue: string | number | boolean | Date;
    }) => trpcClient.serviceRequirement.validateInput.query(data),
  });
};
