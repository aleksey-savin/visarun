import { create } from 'zustand';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@visarun/backend/src/router';

import type {
  User,
  Client,
  UserContactMethod,
  Order,
  OrderItem,
  VisaApplication,
  Citizenship,
  VisaApplicationStatus,
} from '@visarun/backend/node_modules/@prisma/client';

export interface StoreUser extends Partial<User> {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  email?: string | null;
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
  passportExpirationDate?: Date;
  prevViolations?: boolean;
  prevViolationsDesc?: string | null;
  isOutsideTheCountry?: boolean;
  isOutsideTheCountryAt?: Date;
  firstName?: string;
  lastName?: string;
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
}

export interface StoreVisaApplication extends Partial<VisaApplication> {
  id: string;
  orderItemId: string;
  applicationCode: string | null;
  submittedByAgent: boolean;
  status: VisaApplicationStatus;
  note: string | null;
  isMultientry: boolean;
  plannedCountryEntryDate: Date | null;
  revisedActivationDate: Date | null;
  statusNote: string | null;
  country: {
    id: string;
    name: string;
  };
  visaType: {
    id: string | undefined;
    name: string | undefined;
    serviceCost: number | undefined;
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

const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/trpc`,
      headers: () => {
        const token = localStorage.getItem('visarun_access_token');
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

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
  orderItems: OrderItem[];
  visaApplications: StoreVisaApplication[];

  setSaveStatus: (saveStatus: SaveStatus) => void;
  setActiveClientId: (activeClientId: string) => void;
  setOrder: (orderData: Order) => void;
  setUser: (userData: StoreUser) => void;
  setClients: (clients: StoreClient[]) => void;
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => void;
  setOrderItems: (orderItems: OrderItem[]) => void;
  setVisaApplications: (visaApplications: StoreVisaApplication[]) => void;
  setActiveServicePuzzleSection: (activeServicePuzzleSection: ActiveServicePuzzleSection) => void;
}

const useOrderStore = create<OrderStore>((set, get) => ({
  saveStatus: 'saved',
  activeClientId: '',
  activeServicePuzzleSection: 'visa',
  order: {
    id: '',
    userId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    comment: '',
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
  orderItems: [],
  visaApplications: [],

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
  setOrder: (orderData: Order) => set(() => ({ order: orderData })),
  setUser: (userData: StoreUser) => set(() => ({ user: userData })),
  setClients: (clients: StoreClient[]) => set(() => ({ clients })),
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => set(() => ({ contactMethods })),
  setOrderItems: (orderItems: OrderItem[]) => set(() => ({ orderItems })),
  setVisaApplications: (visaApplications: StoreVisaApplication[]) =>
    set(() => ({ visaApplications })),
}));

export default useOrderStore;
