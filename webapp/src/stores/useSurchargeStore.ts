import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SurchargeData {
  id: string;
  citizenshipId: string;
  countryId: string;
  visaTypeId?: string;
  surchargeAmount: number;
  note?: string | null;
  isGlobal: boolean;
  citizenship: {
    id: string;
    name: string;
  };
  country: {
    id: string;
    name: string;
  };
  visaTypes?: Array<{
    id: string;
    visaTypeId: string;
    visaType: {
      id: string;
      name: string;
    };
  }>;
}

export interface SurchargeStore {
  // Cache for surcharge data
  surchargeCache: Map<string, SurchargeData | null>;

  // Loading states
  loadingStates: Map<string, boolean>;

  // Actions
  setSurcharge: (key: string, surcharge: SurchargeData | null) => void;
  getSurcharge: (
    citizenshipId: string,
    countryId: string,
    visaTypeId?: string
  ) => SurchargeData | null;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearCache: () => void;

  // Helper methods
  getSurchargeAmount: (citizenshipId: string, countryId: string, visaTypeId?: string) => number;
  hasSurcharge: (citizenshipId: string, countryId: string, visaTypeId?: string) => boolean;
}

// Helper function to create cache key
const createCacheKey = (citizenshipId: string, countryId: string, visaTypeId?: string): string => {
  return `${citizenshipId}-${countryId}${visaTypeId ? `-${visaTypeId}` : ''}`;
};

export const useSurchargeStore = create<SurchargeStore>()(
  devtools(
    (set, get) => ({
      surchargeCache: new Map(),
      loadingStates: new Map(),

      setSurcharge: (key, surcharge) =>
        set(state => {
          const newCache = new Map(state.surchargeCache);
          newCache.set(key, surcharge);
          return { surchargeCache: newCache };
        }),

      getSurcharge: (citizenshipId, countryId, visaTypeId) => {
        const key = createCacheKey(citizenshipId, countryId, visaTypeId);
        return get().surchargeCache.get(key) || null;
      },

      setLoading: (key, loading) =>
        set(state => {
          const newLoadingStates = new Map(state.loadingStates);
          if (loading) {
            newLoadingStates.set(key, true);
          } else {
            newLoadingStates.delete(key);
          }
          return { loadingStates: newLoadingStates };
        }),

      isLoading: key => {
        return get().loadingStates.get(key) || false;
      },

      clearCache: () =>
        set({
          surchargeCache: new Map(),
          loadingStates: new Map(),
        }),

      getSurchargeAmount: (citizenshipId, countryId, visaTypeId) => {
        const surcharge = get().getSurcharge(citizenshipId, countryId, visaTypeId);
        return surcharge?.surchargeAmount || 0;
      },

      hasSurcharge: (citizenshipId, countryId, visaTypeId) => {
        const surcharge = get().getSurcharge(citizenshipId, countryId, visaTypeId);
        return Boolean(surcharge && surcharge.surchargeAmount > 0);
      },
    }),
    {
      name: 'surcharge-store',
    }
  )
);

// Hook to get surcharge data with automatic caching
export const useSurchargeData = (
  citizenshipId?: string,
  countryId?: string,
  visaTypeId?: string
) => {
  const store = useSurchargeStore();

  if (!citizenshipId || !countryId) {
    return {
      surcharge: null,
      amount: 0,
      hasSurcharge: false,
      isLoading: false,
    };
  }

  const key = createCacheKey(citizenshipId, countryId, visaTypeId);
  const surcharge = store.getSurcharge(citizenshipId, countryId, visaTypeId);
  const isLoading = store.isLoading(key);

  return {
    surcharge,
    amount: surcharge?.surchargeAmount || 0,
    hasSurcharge: Boolean(surcharge && surcharge.surchargeAmount > 0),
    isLoading,
    cacheKey: key,
  };
};
