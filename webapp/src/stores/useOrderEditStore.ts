import { formatCurrency } from '@/utils/currency';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface OrderItemUpdate {
  visaTypeId?: string;
  basePrice?: number;
  finalPrice?: number;
}

export interface Country {
  id: string;
  name: string;
  eVisaAvailable?: boolean;
  favourite?: boolean;
  blacklisted?: Array<{ citizenshipId: string }>;
  visaFree?: Array<{ citizenshipId: string; maxStayDays: number; stampDuration?: number }>;
}

export interface VisaType {
  id: string;
  name: string;
  countryId: string;
  serviceCost: number;
  isMultientry: boolean;
  multientryExtraCost?: number;
  processingMode: string;
  processingUnit: string;
  processingValueFixed?: number;
  processingValueMin?: number;
  processingValueMax?: number;
}

export interface Citizenship {
  id: string;
  name: string;
  emoji?: string;
}

export interface ContactMethod {
  id: string;
  name: string;
  isActive: boolean;
}

export interface VisaApplication {
  id: string;
  orderItemId: string;
  countryId: string;
  visaTypeId?: string;
  status: string;
  applicationCode?: string;
  plannedCountryEntryDate?: Date;
  country?: { id: string; name: string };
  visaType?: VisaType;
}

export interface OrderEditState {
  // Form state
  isSubmitting: boolean;
  isSaving: boolean;
  lastSavedTime: Date | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  errorMessage: string | null;

  // UI state
  passportDate: Date | null;
  isCalendarOpen: boolean;

  // Optimistic updates
  optimisticOrder: any;
  optimisticPrimaryClientData: any;

  // Data caches - fetched once and stored in Zustand
  countries: Country[] | null;
  citizenships: Citizenship[] | null;
  contactMethods: ContactMethod[] | null;
  visaApplications: VisaApplication[] | null;
  visaTypesByCountry: Record<string, VisaType[]>;

  // Loading states
  countriesLoading: boolean;
  citizenshipsLoading: boolean;
  contactMethodsLoading: boolean;
  visaApplicationsLoading: boolean;

  // Actions
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSavedTime: (time: Date | null) => void;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  setErrorMessage: (message: string | null) => void;
  setPassportDate: (date: Date | null) => void;
  setIsCalendarOpen: (isOpen: boolean) => void;
  setOptimisticOrder: (order: any) => void;
  setOptimisticPrimaryClientData: (data: any) => void;

  // Data setters
  setCountries: (countries: Country[]) => void;
  setCitizenships: (citizenships: Citizenship[]) => void;
  setContactMethods: (contactMethods: ContactMethod[]) => void;
  setVisaApplications: (visaApplications: VisaApplication[]) => void;
  setVisaTypesForCountry: (countryId: string, visaTypes: VisaType[]) => void;

  // Loading state setters
  setCountriesLoading: (loading: boolean) => void;
  setCitizenshipsLoading: (loading: boolean) => void;
  setContactMethodsLoading: (loading: boolean) => void;
  setVisaApplicationsLoading: (loading: boolean) => void;

  // Order item operations
  updateOptimisticOrderItem: (orderItemId: string, updates: OrderItemUpdate) => void;
  addOptimisticOrderItem: (newOrderItem: any) => void;
  removeOptimisticOrderItem: (orderItemId: string) => void;

  // Helper getters
  getCountryById: (countryId: string) => Country | undefined;
  getCitizenshipById: (citizenshipId: string) => Citizenship | undefined;
  getVisaTypesForCountry: (countryId: string) => VisaType[];
  getVisaApplicationsByOrderId: (orderId: string) => VisaApplication[];

  // Reset state
  resetState: () => void;
}

const initialState = {
  isSubmitting: false,
  isSaving: false,
  lastSavedTime: null,
  saveStatus: 'idle' as const,
  errorMessage: null,
  passportDate: null,
  isCalendarOpen: false,
  optimisticOrder: null,
  optimisticPrimaryClientData: null,
  countries: null,
  citizenships: null,
  contactMethods: null,
  visaApplications: null,
  visaTypesByCountry: {},
  countriesLoading: false,
  citizenshipsLoading: false,
  contactMethodsLoading: false,
  visaApplicationsLoading: false,
};

export const useOrderEditStore = create<OrderEditState>()(
  devtools(
    (set): OrderEditState => ({
      ...initialState,

      // Basic setters
      setIsSubmitting: isSubmitting => set({ isSubmitting }),
      setIsSaving: isSaving => set({ isSaving }),
      setLastSavedTime: lastSavedTime => set({ lastSavedTime }),
      setSaveStatus: saveStatus => set({ saveStatus }),
      setErrorMessage: errorMessage => set({ errorMessage }),
      setPassportDate: passportDate => set({ passportDate }),
      setIsCalendarOpen: isCalendarOpen => set({ isCalendarOpen }),
      setOptimisticOrder: optimisticOrder => set({ optimisticOrder }),
      setOptimisticPrimaryClientData: optimisticPrimaryClientData =>
        set({ optimisticPrimaryClientData }),

      // Data setters
      setCountries: countries => set({ countries }),
      setCitizenships: citizenships => set({ citizenships }),
      setContactMethods: contactMethods => set({ contactMethods }),
      setVisaApplications: visaApplications => set({ visaApplications }),
      setVisaTypesForCountry: (countryId, visaTypes) =>
        set(state => ({
          visaTypesByCountry: { ...state.visaTypesByCountry, [countryId]: visaTypes },
        })),

      // Loading state setters
      setCountriesLoading: countriesLoading => set({ countriesLoading }),
      setCitizenshipsLoading: citizenshipsLoading => set({ citizenshipsLoading }),
      setContactMethodsLoading: contactMethodsLoading => set({ contactMethodsLoading }),
      setVisaApplicationsLoading: visaApplicationsLoading => set({ visaApplicationsLoading }),

      // Helper getters
      getCountryById: (countryId: string) => {
        const state = useOrderEditStore.getState();
        return state.countries?.find(country => country.id === countryId);
      },
      getCitizenshipById: (citizenshipId: string) => {
        const state = useOrderEditStore.getState();
        return state.citizenships?.find(citizenship => citizenship.id === citizenshipId);
      },
      getVisaTypesForCountry: (countryId: string) => {
        const state = useOrderEditStore.getState();
        return state.visaTypesByCountry[countryId] || [];
      },
      getVisaApplicationsByOrderId: (orderId: string) => {
        const state = useOrderEditStore.getState();
        return (
          state.visaApplications?.filter(app =>
            state.optimisticOrder?.items?.some(
              (item: any) => item.id === app.orderItemId && item.orderId === orderId
            )
          ) || []
        );
      },

      // Order item operations
      updateOptimisticOrderItem: (orderItemId: string, updates: OrderItemUpdate) =>
        set(state => {
          if (!state.optimisticOrder?.items) return state;

          const updatedItems = state.optimisticOrder.items.map((item: any) => {
            if (item.id === orderItemId) {
              return { ...item, ...updates };
            }
            return item;
          });

          return {
            optimisticOrder: { ...state.optimisticOrder, items: updatedItems },
          };
        }),

      addOptimisticOrderItem: (newOrderItem: any) =>
        set(state => {
          if (!state.optimisticOrder) return state;

          const existingItems = state.optimisticOrder.items || [];
          return {
            optimisticOrder: {
              ...state.optimisticOrder,
              items: [...existingItems, newOrderItem],
            },
          };
        }),

      removeOptimisticOrderItem: (orderItemId: string) =>
        set(state => {
          if (!state.optimisticOrder?.items) return state;

          const filteredItems = state.optimisticOrder.items.filter(
            (item: any) => item.id !== orderItemId
          );
          return {
            optimisticOrder: { ...state.optimisticOrder, items: filteredItems },
          };
        }),

      // Reset state
      resetState: () => set(initialState),
    }),
    {
      name: 'order-edit-store',
    }
  )
);

// Utility function to calculate total amount from order items
export const calculateTotalAmount = (order: { items?: Array<{ finalPrice?: number }> }): string => {
  if (!order?.items || order.items.length === 0) {
    return formatCurrency(0, 'VND');
  }
  const total = order.items.reduce((sum: number, item) => sum + (item.finalPrice || 0), 0);
  return formatCurrency(total, 'VND');
};

// Helper function to check if passport expires within 6 months
export const isPassportExpiringWithin6Months = (expirationDate: Date | null): boolean => {
  if (!expirationDate) return false;
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return expirationDate <= sixMonthsFromNow;
};

// Helper function to check if visa section should be shown
export const shouldShowVisaCard = (
  citizenshipId: string | undefined,
  passportExpirationDate: Date | null
): boolean => {
  const hasCitizenship = Boolean(citizenshipId && citizenshipId !== 'none');
  const passportNotExpiringSoon = Boolean(
    passportExpirationDate && !isPassportExpiringWithin6Months(passportExpirationDate)
  );
  return hasCitizenship && passportNotExpiringSoon;
};

// These hooks will be moved to a separate file to avoid circular dependencies
