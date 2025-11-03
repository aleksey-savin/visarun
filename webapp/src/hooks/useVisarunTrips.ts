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
      preferredDepartureDate
        ? `${preferredDepartureDate.getFullYear()}-${(preferredDepartureDate.getMonth() + 1).toString().padStart(2, '0')}-${preferredDepartureDate.getDate().toString().padStart(2, '0')}`
        : null,
    ],
    queryFn: async () => {
      if (!preferredDepartureCityId || !preferredVisarunCountryId || !preferredDepartureDate) {
        return [];
      }

      // Send only date part to avoid timezone issues
      const dateOnly = new Date(
        preferredDepartureDate.getFullYear(),
        preferredDepartureDate.getMonth(),
        preferredDepartureDate.getDate(),
        12, // Use noon to avoid timezone boundary issues
        0,
        0,
        0
      );

      const result = await trpcClient.visarunTrip.getAll.query({
        preferredDepartureCityId,
        preferredVisarunCountryId,
        preferredDepartureDate: dateOnly.toISOString(),
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
