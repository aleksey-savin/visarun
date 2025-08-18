import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '../lib/trpc';

export interface CreateRequirementData {
  serviceType: 'visa' | 'visarun';
  isOptional?: boolean;
  inputType: 'document' | 'checkpoint' | 'date' | 'text' | 'boolean';
  operator?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';
  thresholdNumber?: number;
  thresholdDate?: Date;
  thresholdText?: string;
  thresholdBool?: boolean;
  checkpointValue?: string;
  title: string;
  description?: string;
  appliesToAllCitizenships?: boolean;
  sampleUrl?: string;
  citizenshipIds?: string[];
  visaTypeIds?: string[];
  routeIds?: string[];
  // New fields for application scope
  applicationScope?: 'specific' | 'country_all' | 'global';
  countryId?: string;
}

export interface UpdateRequirementData {
  id: string;
  serviceType?: 'visa' | 'visarun';
  isOptional?: boolean;
  inputType?: 'document' | 'checkpoint' | 'date' | 'text' | 'boolean';
  operator?: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';
  thresholdNumber?: number;
  thresholdDate?: Date;
  thresholdText?: string;
  thresholdBool?: boolean;
  checkpointValue?: string;
  title?: string;
  description?: string;
  appliesToAllCitizenships?: boolean;
  sampleUrl?: string;
  citizenshipIds?: string[];
  visaTypeIds?: string[];
  routeIds?: string[];
  // New fields for application scope
  applicationScope?: 'specific' | 'country_all' | 'global';
  countryId?: string;
}

export interface GetRequirementsFilters {
  limit?: number;
  offset?: number;
  search?: string;
  serviceType?: 'visa' | 'visarun';
  inputType?: 'document' | 'checkpoint' | 'date' | 'text' | 'boolean';
  visaTypeId?: string;
  citizenshipId?: string;
  countryId?: string;
}

export const useRequirements = (filters?: GetRequirementsFilters) => {
  return useQuery({
    queryKey: ['requirements', filters],
    queryFn: () => trpcClient.requirement.getAll.query(filters || {}),
  });
};

export const useRequirement = (id: string) => {
  return useQuery({
    queryKey: ['requirement', id],
    queryFn: async () => {
      const response = await trpcClient.requirement.getOne.query({ id });
      return response.requirement;
    },
    enabled: !!id,
  });
};

export const useRequirementsByVisaType = (visaTypeId: string, citizenshipId?: string) => {
  return useQuery({
    queryKey: ['requirements', 'visaType', visaTypeId, citizenshipId],
    queryFn: () =>
      trpcClient.requirement.getByVisaType.query({
        visaTypeId,
        citizenshipId,
        includeGeneral: true,
      }),
    enabled: !!visaTypeId,
  });
};

export const useRequirementsByCitizenship = (
  citizenshipId: string,
  serviceType?: 'visa' | 'visarun'
) => {
  return useQuery({
    queryKey: ['requirements', 'citizenship', citizenshipId, serviceType],
    queryFn: () =>
      trpcClient.requirement.getByCitizenship.query({
        citizenshipId,
        serviceType,
      }),
    enabled: !!citizenshipId,
  });
};

export const useCreateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRequirementData) => trpcClient.requirement.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
};

export const useUpdateRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRequirementData) => trpcClient.requirement.edit.mutate(data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['requirement', data.requirement?.id] });
    },
  });
};

export const useDeleteRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.requirement.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
};

export const useValidateRequirementInput = () => {
  return useMutation({
    mutationFn: (data: { requirementId: string; inputValue: string | number | boolean | Date }) =>
      trpcClient.requirement.validateInput.query(data),
  });
};
