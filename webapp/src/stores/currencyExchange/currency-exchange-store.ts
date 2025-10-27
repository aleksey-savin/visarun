import type { CurrencyExchangeStatus, UserContactMethod } from '@prisma/client';
import { create } from 'zustand';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface StoreCurrency {
  id: string;
  name: string;
  isBegottening: boolean;
}

export interface StoreBankingDetails {
  id: string;
  content?: string | null;
  documentUrl?: string | null;
}

export interface StoreTransaction {
  id: string;
  status: string;
  amountInSelectedCurrency: number | null;
  checkUrl?: string | null;
  isCompanyTransaction: boolean;
  isInCash: boolean;
  senderId?: string;
  begottenByCurrencyExchangeId?: string;
  currencyExchangeId?: string;
}

export interface StoreClient {
  firstName: string;
  lastName: string;
  bankingDetails?: StoreBankingDetails;
  user: {
    contactMethods: StoreUserContactMethod[];
  };
}

export interface StoreCurrencyExchange {
  id: string;
  isBegottening: boolean;
  orderItemId: string;
  position: number;
  exchangeRate?: number | null;
  amountInSelectedCurrencyFrom?: number;
  amountInSelectedCurrencyTo?: number;
  status: CurrencyExchangeStatus;
  cancelReason?: string;
  canceledByClient: boolean;
  deadline?: Date;
  minTransactionAmountInSelectedCurrency?: number;
  fromCurrencyId?: string;
  toCurrencyId?: string;
  createdById: string;
  updatedById: string;
  fromCurrency: StoreCurrency;
  toCurrency: StoreCurrency;
  transactions: StoreTransaction[] | any[];
  begottenTransactions: StoreTransaction[] | any[];
  finishedTransactionsAmountInSelectedCurrency?: number;
  inProgressTransactionsAmountInSelectedCurrency?: number;
  finishedBegottenTransactionsAmountInSelectedCurrency?: number;
  inProgressBegottenTransactionsAmountInSelectedCurrency?: number;
  orderItem?: {
    client: any;
  };
  // createdBy
  // updatedBy
  createdAt: Date;
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

interface CurrencyExchangeStore {
  saveStatus: SaveStatus;
  contactMethods: StoreUserContactMethod[];
  currencyExchanges: StoreCurrencyExchange[];
  allCurrencyExchanges: StoreCurrencyExchange[];
  begotteningCurrencyExchange?: StoreCurrencyExchange;

  setSaveStatus: (saveStatus: SaveStatus) => void;
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => void;
  setCurrencyExchanges: (currencyExchanges: StoreCurrencyExchange[]) => void;
  setAllCurrencyExchanges: (allCurrencyExchanges: StoreCurrencyExchange[]) => void;
  setBegotteningCurrencyExchange: (begotteningCurrencyExchange: StoreCurrencyExchange) => void;
  reset: () => void;
}

const useCurrencyExchangeStore = create<CurrencyExchangeStore>((set, _, store) => ({
  saveStatus: 'saved',
  contactMethods: [],
  currencyExchanges: [],
  allCurrencyExchanges: [],

  setSaveStatus: async (saveStatus: SaveStatus) => {
    set({ saveStatus });

    // if (saveStatus === 'saved') {
    //     const currentState = get();
    //     const now = new Date();
    //
    //     try {
    //         await trpcClient.order.edit.mutate({
    //             id: currentState.order.id!,
    //             updatedAt: now.toISOString(),
    //         });
    //
    //         set({
    //             order: {
    //                 ...currentState.order,
    //                 updatedAt: now,
    //             },
    //         });
    //     } catch {
    //         set({ saveStatus: 'error' });
    //     }
    // }
  },
  setContactMethods: (contactMethods: StoreUserContactMethod[]) => set(() => ({ contactMethods })),
  setCurrencyExchanges: (currencyExchanges: StoreCurrencyExchange[]) =>
    set(() => ({ currencyExchanges })),
  setAllCurrencyExchanges: (allCurrencyExchanges: StoreCurrencyExchange[]) =>
    set(() => ({ allCurrencyExchanges })),
  setBegotteningCurrencyExchange: (begotteningCurrencyExchange: StoreCurrencyExchange) =>
    set(() => ({ begotteningCurrencyExchange })),
  reset: () => {
    set(store.getInitialState());
  },
}));

export default useCurrencyExchangeStore;
