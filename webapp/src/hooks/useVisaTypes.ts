import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '../lib/trpc';

export interface GetVisaTypesFilters {
  limit?: number;
  offset?: number;
  countryId?: string;
  isMultientry?: boolean;
  processingMode?: 'fixed' | 'approximate';
  processingUnit?: 'hours' | 'days';
  search?: string;
}

export interface CreateVisaTypeData {
  name: string;
  countryId: string;
  serviceCost: number;
  isMultientry?: boolean;
  multientryExtraCost?: number;
  processingMode: 'fixed' | 'approximate';
  processingUnit: 'hours' | 'days';
  processingValueFixed?: number;
  processingValueMin?: number;
  processingValueMax?: number;
  submissionDayIncluded?: boolean;
}

export interface UpdateVisaTypeData {
  id: string;
  name?: string;
  countryId?: string;
  serviceCost?: number;
  isMultientry?: boolean;
  multientryExtraCost?: number;
  processingMode?: 'fixed' | 'approximate';
  processingUnit?: 'hours' | 'days';
  processingValueFixed?: number;
  processingValueMin?: number;
  processingValueMax?: number;
  submissionDayIncluded?: boolean;
}

export const useVisaTypes = (filters?: GetVisaTypesFilters) => {
  return useQuery({
    queryKey: ['visaTypes', filters],
    queryFn: () => trpcClient.visaType.getAll.query(filters || {}),
  });
};

export const useVisaType = (id: string) => {
  return useQuery({
    queryKey: ['visaType', id],
    queryFn: () => trpcClient.visaType.getOne.query({ id }),
    enabled: !!id,
  });
};

export const useVisaTypesByCountry = (countryId: string) => {
  return useQuery({
    queryKey: ['visaTypes', 'country', countryId],
    queryFn: () => trpcClient.visaType.getByCountry.query({ countryId }),
    enabled: !!countryId,
  });
};

export const useCreateVisaType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVisaTypeData) => trpcClient.visaType.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visaTypes'] });
    },
  });
};

export const useUpdateVisaType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVisaTypeData) => trpcClient.visaType.edit.mutate(data),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['visaTypes'] });
      queryClient.invalidateQueries({ queryKey: ['visaType', (data as any).visaType.id] });
    },
  });
};

export const useDeleteVisaType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.visaType.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visaTypes'] });
    },
  });
};
