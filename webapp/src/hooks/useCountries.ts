import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '../lib/trpc';

export interface GetCountriesFilters {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface CreateCountryData {
  name: string;
  eVisaAvailable: boolean;
  multivisaAvailable: boolean;
}

export const useCountries = (filters?: GetCountriesFilters) => {
  return useQuery({
    queryKey: ['countries', filters],
    queryFn: async () => {
      const response = await trpcClient.country.getAll.query();
      return response;
    },
  });
};

export const useCountry = (id: string) => {
  return useQuery({
    queryKey: ['country', id],
    queryFn: () => trpcClient.country.getOne.query({ id }),
    enabled: !!id,
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCountryData) => trpcClient.country.create.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trpcClient.country.delete.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};
