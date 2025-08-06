import { trpc } from '@/lib/trpc';

export const useSurcharge = (citizenshipId?: string, countryId?: string, visaTypeId?: string) => {
  // Simple TRPC query without complex caching
  const {
    data: surchargeData,
    isLoading,
    error,
  } = trpc.visaCitizenshipSurcharge.getByCitizenshipAndCountry.useQuery(
    {
      citizenshipId: citizenshipId || '',
      countryId: countryId || '',
      visaTypeId,
    },
    {
      enabled: !!citizenshipId && !!countryId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const surcharge = surchargeData?.surcharge;

  return {
    surcharge,
    amount: surcharge?.surchargeAmount || 0,
    hasSurcharge: Boolean(surcharge && surcharge.surchargeAmount > 0),
    isLoading,
    error,
    citizenship: surcharge?.citizenship,
    country: surcharge?.country,
  };
};

// Hook for getting surcharge amount quickly without full data
export const useSurchargeAmount = (
  citizenshipId?: string,
  countryId?: string,
  visaTypeId?: string
): number => {
  const { amount } = useSurcharge(citizenshipId, countryId, visaTypeId);
  return amount;
};

// Hook for checking if surcharge exists
export const useHasSurcharge = (
  citizenshipId?: string,
  countryId?: string,
  visaTypeId?: string
): boolean => {
  const { hasSurcharge } = useSurcharge(citizenshipId, countryId, visaTypeId);
  return hasSurcharge;
};
