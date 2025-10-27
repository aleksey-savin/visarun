import { create } from 'zustand';

import { trpcClient } from '@/lib/trpc';

import type {
  User,
  Client,
  UserContactMethod,
  Order,
  OrderItem,
  Citizenship,
  VisaApplicationStatus,
    CurrencyExchangeStatus,
  OrderStatus,
  ClientDocument,
  Requirement,
  ClientRequirement,
  PaymentMethod,
  City,
  Country,
  PassengerStatus,
  VisarunServiceType,
} from '@visarun/backend/node_modules/@prisma/client';

// Frontend-compatible Decimal type that works without Prisma runtime dependency
export type Decimal = string;

// Helper function to ensure decimal values are strings
export const toDecimal = (value: any): Decimal => {
  if (value === null || value === undefined) return '0';
  return String(value);
};

export interface StoreUser extends Partial<User> {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  updatedAt: Date;
}

export interface StoreUserContactMethod extends Partial<UserContactMethod> {
  id: string;
  userId: string;
  value: string | null;
  url?: string | null;
  createdAt: Date;
  updatedAt: Date;
  method?: {
    id: string;
    name: string;
    icon: string | null;
    description?: string | null;
  } | null;
}

export interface StoreClient extends Partial<Client> {
  id: string;
  userId: string | null;
  isPrimary: boolean;
  preConfirmPassportIsValid: boolean;
  birthDate?: Date;
  passportExpirationDate?: Date;
  prevViolations?: boolean;
  prevViolationsDesc?: string | null;
  isOutsideTheCountry?: boolean;
  isOutsideTheCountryAt?: Date;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  citizenship?: Citizenship & {
    blacklisted?: {
      citizenshipId: string;
      countryId: string;
    }[];
    visaFree?: {
      citizenshipId: string;
      countryId: string;
      stampDuration: number;
    }[];
    surcharges?: {
      id: string;
      citizenshipId: string;
      surchargeAmount: number;
      note?: string | null;
      countryId: string;
      isGlobal: boolean;
    }[];
  };
  bankingDetails?: {
      id: string;
      content?: string | null;
      documentUrl?: string | null;
      clientId: string;
  };
  documents?: (Omit<ClientDocument, 'reviewedAt' | 'uploadedAt' | 'expiresAt'> & {
    reviewedAt: string | null;
    uploadedAt: string;
    expiresAt: string | null;
  })[];
  requirements?: (Omit<ClientRequirement, 'reviewedAt' | 'dateValue' | 'submittedAt'> & {
    reviewedAt: string | null;
    dateValue: string | null;
    submittedAt: string | null;
  })[];
  visaRequirements?: Requirement[];
  errors?: string[];
}

export interface StoreVisaApplication {
  id: string;
  orderItemId: string;
  applicationCode: string | null;
  type: string;
  submittedByAgent: boolean;
  status: VisaApplicationStatus;
  note: string | null;
  isMultientry: boolean;
  clientIsInTheCountry: boolean;
  plannedCountryEntryDate: Date | null;
  plannedCountryExitDate: Date | null;
  plannedCompletionDate: Date | null;
  stampUntilDate: Date | null;
  revisedActivationDate: Date | null;
  statusNote: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  countryId?: string;
  visaTypeId?: string | null;
  cancelReason?: string | null;
  denialReason?: string | null;
  stampIsRecieved?: boolean;
  isArchived?: boolean;
  country: {
    id: string;
    name: string;
  };
  visaType: {
    id: string | undefined;
    name: string | undefined;
    serviceCost: number | undefined;
    accelerationCost: number | null | undefined;
    accelerationAvailable: boolean | null;
    isMultientry: boolean | undefined;
    multientryExtraCost: number | null | undefined;
    processingMode: 'fixed' | 'approximate' | undefined;
    processingUnit: 'hours' | 'days' | undefined;
    processingValueFixed: number | null | undefined;
    processingValueMin: number | null | undefined;
    processingValueMax: number | null | undefined;
  };
  clientVisas?: {
    id: string;
    validFrom: Date;
    validTo: Date;
    notifiedExpiry: boolean;
  }[];
}

export interface StoreCurrencyExchange {
    id: string;
    orderItemId: string;
    position: number;
    exchangeRate?: number;
    amountInSelectedCurrencyFrom?: number;
    amountInSelectedCurrencyTo?: number;
    status: CurrencyExchangeStatus;
    cancelReason?: string;
    canceledByClient?: boolean;
    deadline?: Date;
    minTransactionAmountInSelectedCurrency?: number;
    fromCurrencyId?: string;
    toCurrencyId?: string;
    createdById: string;
    updatedById: string;
    // fromCurrency: StoreCurrency;
    // toCurrency: StoreCurrency;
    // transactions: StoreTransaction[];
    // finishedTransactionsAmountInSelectedCurrency?: number;
    // inProgressTransactionsAmountInSelectedCurrency?: number;
    // createdBy
    // updatedBy
    createdAt: Date;
    updatedAt: Date;
}

export interface StoreOrderItem extends OrderItem {
  errors?: string[];
}

export interface StoreVisarunPassenger {
  id: string;
  orderItemId: string;
  tripId: string;
  tripTransportId?: string | null;
  clientId: string;
  serviceType: VisarunServiceType;
  seatNumber?: string | null;
  seatClassId?: string | null;
  pickupAddress?: string | null;
  pickupLocationId?: string | null;
  pickupTime?: string | null;
  routeStopId?: string | null;
  status: PassengerStatus;
  createdAt: Date;
  updatedAt: Date;
  trip: {
    id: string;
    departureDateTime: Date;
    route: {
      id: string;
      name: string | null;
      routeStops: {
        id: string;
        stopType: string;
        departureTime: string | null;
        arrivalTime: string | null;
        waitingDuration: number | null;
        city: {
          id: string;
          name: string;
        };
      }[];
    };
  };
  seatClass?: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
  tripTransport?: {
    id: string;
    transport: {
      id: string;
      name: string;
    };
  } | null;
  pickupStop?: {
    id: string;
    city: {
      id: string;
      name: string;
    };
  } | null;
  pickupLocation?: {
    id: string;
    name: string;
    address: string;
  } | null;
}

export interface StoreOrderPayment {
  id: string;
  currencyId?: string;
  amount?: Decimal;
  amountInSelectedCurrency?: Decimal;
  paymentMethod?: PaymentMethod | 'transfer';
  documentUrl?: string | null;
  acceptedById?: string | null;
  acceptedAt?: Date | null;
  paidAt?: Date;
  confirmPaymentWithoutDocument?: boolean;
  acceptedByUser?: {
    id: string;
    email: string | null;
    firstName?: string;
    lastName?: string;
  } | null;
  currency?: {
    id: string;
    name: string;
  };
  errors?: string[];
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ActiveServicePuzzleSection = 'visa' | 'visarun';

interface OrderStore {
  saveStatus: SaveStatus;
  activeClientId: string;
  activeServicePuzzleSection: ActiveServicePuzzleSection;
  order: Order;
  user: StoreUser;
  clients: StoreClient[];
  contactMethods: StoreUserContactMethod[];
  orderItems: StoreOrderItem[];
  visaApplications: StoreVisaApplication[];
  visarunPassengers: StoreVisarunPassenger[];
  currencyExchanges: StoreCurrencyExchange[];
  orderPayments: StoreOrderPayment[];
  // visarun
  preferredDepartureCity: City | null;
  preferredVisarunCountry: Country | null;
  preferredDepartureDate: Date;
  // ---
  setSaveStatus: (saveStatus: SaveStatus) => void;
  setActiveClientId: (activeClientId: string) => void;
  setOrder: (orderData: Order) => void;
  updateOrderStatus: (status: OrderStatus) => Promise<void>;

  setUser: (userData: StoreUser) => void;
  setClients: (clients: StoreClient[]) => void;
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => void;
  //visarun
  setPreferredDepartureCity: (preferredDepartureCity: City | null) => void;
  setPreferredVisarunCountry: (preferredVisarunCountry: Country | null) => void;
  setPreferredDepartureDate: (preferredDepartureDate: Date) => void;
  // ----
  setOrderItems: (orderItems: StoreOrderItem[]) => void;
  setVisaApplications: (visaApplications: StoreVisaApplication[]) => void;
  setVisarunPassengers: (visarunPassengers: StoreVisarunPassenger[]) => void;
  setCurrencyExchanges: (currencyExchanges: StoreCurrencyExchange[]) => void;
  setOrderPayments: (orderPayments: StoreOrderPayment[]) => void;
  setActiveServicePuzzleSection: (activeServicePuzzleSection: ActiveServicePuzzleSection) => void;
  reset: () => void;
}

const useOrderStore = create<OrderStore>((set, get, store) => ({
  saveStatus: 'saved',
  activeClientId: '',
  activeServicePuzzleSection: 'visa',
  order: {
    id: '',
    userId: '',
    postPayment: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    comment: '',
    createdById: null,
    updatedById: null,
  },
  user: {
    id: '',
    email: '',
    firstName: '',
    middleName: '',
    lastName: '',
    updatedAt: new Date(),
  },
  clients: [],
  contactMethods: [],
  // visarun
  preferredDepartureCity: null,
  preferredVisarunCountry: null,
  preferredDepartureDate: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  })(),
  // ---
  orderItems: [],
  visaApplications: [],
  visarunPassengers: [],
    currencyExchanges: [],
  orderPayments: [],

  setSaveStatus: async (saveStatus: SaveStatus) => {
    set({ saveStatus });

    if (saveStatus === 'saved') {
      const currentState = get();
      const now = new Date();

      try {
        await trpcClient.order.edit.mutate({
          id: currentState.order.id!,
          updatedAt: now.toISOString(),
        });

        set({
          order: {
            ...currentState.order,
            updatedAt: now,
          },
        });
      } catch {
        set({ saveStatus: 'error' });
      }
    }
  },
  setActiveClientId: (activeClientId: string) => set({ activeClientId }),
  setActiveServicePuzzleSection: (activeServicePuzzleSection: ActiveServicePuzzleSection) =>
    set({ activeServicePuzzleSection }),
  setOrder: (orderData: Order) => {
    set(() => ({ order: orderData }));
  },
  updateOrderStatus: async (status: OrderStatus) => {
    // Update order status in store
    set(state => ({
      order: {
        ...state.order,
        status,
        updatedAt: new Date(),
      },
    }));

    // If order status is being set to 'submitted', update related visa applications
    if (status === 'submitted') {
      const currentState = useOrderStore.getState();
      const draftVisaApplications = currentState.visaApplications.filter(
        visaApp => visaApp.status === 'draft'
      );
      const draftCurrencyExchanges = currentState.currencyExchanges.filter(
          exchange => exchange.status === 'draft'
      );

      // Update each draft visa application to pending_submit
      for (const visaApp of draftVisaApplications) {
        try {
          await trpcClient.visaApplication.updateStatus.mutate({
            id: visaApp.id,
            status: 'pending_submit',
          });

          // Update the visa application in the local store
          set(state => ({
            visaApplications: state.visaApplications.map(va =>
              va.id === visaApp.id ? { ...va, status: 'pending_submit' as const } : va
            ),
          }));
        } catch (error) {
          console.error(`Failed to update visa application ${visaApp.id} status:`, error);
        }
      }

        // Update each draft currency exchange to in_progress
        for (const exchange of draftCurrencyExchanges) {
            try {
                await trpcClient.currencyExchange.updateStatus.mutate({
                    id: exchange.id,
                    status: 'in_progress',
                });
    
                // Update the currency exchange in the local store
                set(state => ({
                    currencyExchanges: state.currencyExchanges.map(ex =>
                        ex.id === exchange.id ? { ...ex, status: 'in_progress' as const } : ex
                    ),
                }));
            } catch (error) {
                console.error(`Failed to update currency exchange ${exchange.id} status:`, error);
            }
        }
    }
  },
  setUser: (userData: StoreUser) => set(() => ({ user: userData })),
  setClients: (clients: StoreClient[]) => set(() => ({ clients })),
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => set(() => ({ contactMethods })),
  setOrderItems: (orderItems: StoreOrderItem[]) => set(() => ({ orderItems })),
  setVisaApplications: (visaApplications: StoreVisaApplication[]) =>
    set(() => ({ visaApplications })),
  setVisarunPassengers: (visarunPassengers: StoreVisarunPassenger[]) =>
    set(() => ({ visarunPassengers })),
    setCurrencyExchanges: (currencyExchanges: StoreCurrencyExchange[]) =>
        set(() => ({ currencyExchanges })),
  setOrderPayments: (orderPayments: StoreOrderPayment[]) => set(() => ({ orderPayments })),
  setPreferredDepartureDate: (date: Date) => set(() => ({ preferredDepartureDate: date })),
  setPreferredDepartureCity: (city: City | null) => set(() => ({ preferredDepartureCity: city })),
  setPreferredVisarunCountry: (country: Country | null) =>
    set(() => ({ preferredVisarunCountry: country })),
  reset: () => {
    set(store.getInitialState());
  },
}));

export default useOrderStore;
