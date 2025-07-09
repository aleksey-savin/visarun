import { useQuery } from '@tanstack/react-query';
import { trpcClient } from '@/lib/trpc';

export interface GetCitizenshipsFilters {
  limit?: number;
  offset?: number;
  search?: string;
  favourite?: boolean;
}

export const useCitizenships = (filters: GetCitizenshipsFilters = {}) => {
  return useQuery({
    queryKey: ['citizenships', filters],
    queryFn: () => trpcClient.citizenship.getAll.query(filters),
    enabled: true,
  });
};

export const useCitizenship = (id: string) => {
  return useQuery({
    queryKey: ['citizenship', id],
    queryFn: () => trpcClient.citizenship.getOne.query({ id }),
    enabled: !!id,
  });
};
