import { trpcClient } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';

interface UseVisarunTripsProps {
  preferredDepartureCityId?: string;
  preferredVisarunCountryId?: string;
  preferredDepartureDate?: Date;
  enabled?: boolean;
}

export const useVisarunTrips = ({
  preferredDepartureCityId,
  preferredVisarunCountryId,
  preferredDepartureDate,
  enabled = true,
}: UseVisarunTripsProps) => {
  return useQuery({
    queryKey: [
      'visarunTrips',
      'smart',
      preferredDepartureCityId,
      preferredVisarunCountryId,
      preferredDepartureDate?.toISOString(),
    ],
    queryFn: async () => {
      if (!preferredDepartureCityId || !preferredVisarunCountryId || !preferredDepartureDate) {
        return [];
      }

      const result = await trpcClient.visarunTrip.getAll.query({
        preferredDepartureCityId,
        preferredVisarunCountryId,
        preferredDepartureDate: preferredDepartureDate.toISOString(),
      });

      return result;
    },
    enabled:
      enabled &&
      !!preferredDepartureCityId &&
      !!preferredVisarunCountryId &&
      !!preferredDepartureDate,
    staleTime: 5 * 60 * 1000, // 5 минут
  });
};
