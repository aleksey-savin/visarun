import { create } from 'zustand';

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@visarun/backend/src/router';

import { Client } from '@/types/Client.tsx';
import { OrderItem } from '@/types/OrderItem.tsx';

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

interface Order {
  id?: string;
  userId?: string;
  status?: string;
  updatedAt?: string;
}

interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
}

interface ContactMethod {
  id?: string;
  method: {
    id: string;
    name: string;
  };
  url?: string | null;
  value?: string | null;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ActiveServicePuzzleSection = 'visa' | 'visarun';

interface OrderStore {
  saveStatus: SaveStatus;
  activeServicePuzzleSection: ActiveServicePuzzleSection;
  order: Order;
  user: User;
  clients: Client[];
  contactMethods: ContactMethod[];
  orderItems: OrderItem[];

  setSaveStatus: (saveStatus: SaveStatus) => void;
  setOrder: (orderData: Order) => void;
  setUser: (userData: User) => void;
  setClients: (clients: Client[]) => void;
  setContactMethods: (contactMethods: ContactMethod[]) => void;
  setOrderItems: (orderItems: OrderItem[]) => void;
  setActiveServicePuzzleSection: (activeServicePuzzleSection: ActiveServicePuzzleSection) => void;
}

const useOrderStore = create<OrderStore>((set, get) => ({
  saveStatus: 'saved',
  activeServicePuzzleSection: 'visa',
  order: {},
  user: {},
  clients: [],
  contactMethods: [],
  orderItems: [],

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
            updatedAt: now.toISOString(),
          },
        });
      } catch {
        set({ saveStatus: 'error' });
      }
    }
  },
  setActiveServicePuzzleSection: (activeServicePuzzleSection: ActiveServicePuzzleSection) =>
    set({ activeServicePuzzleSection }),
  setOrder: (orderData: Order) => set(() => ({ order: orderData })),
  setUser: (userData: User) => set(() => ({ user: userData })),
  setClients: (clients: Client[]) => set(() => ({ clients })),
  setContactMethods: (contactMethods: ContactMethod[]) => set(() => ({ contactMethods })),
  setOrderItems: (orderItems: OrderItem[]) => set(() => ({ orderItems })),
}));

export default useOrderStore;
