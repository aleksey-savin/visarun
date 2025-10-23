import type {CurrencyExchangeStatus, UserContactMethod} from "@prisma/client";
import {create} from "zustand";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface StoreCurrency {
    id: string;
    name: string;
}

export interface StoreBankingDetails {
    id: string;
    content?: string;
    documentUrl?: string;
}

export interface StoreTransaction {
    id: string;
    status: string;
    amountInSelectedCurrency?: number;
    checkUrl?: string;
    isCompanyTransaction: boolean;
    isInCash: boolean;
    senderId?: string;
    detailsSent?: boolean,
    paymentConfirmed?: boolean,
    clientsInformed?: boolean,
    paymentCompleted?: boolean,
}

export interface StoreClient {
    firstName: string;
    lastName: string;
    bankingDetails: StoreBankingDetails;
    user: {
        contactMethods: StoreUserContactMethod[]
    }
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
    fromCurrency: StoreCurrency;
    toCurrency: StoreCurrency;
    transactions: StoreTransaction[];
    finishedTransactionsAmountInSelectedCurrency?: number;
    inProgressTransactionsAmountInSelectedCurrency?: number;
    orderItem?: {
        client: StoreClient;
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

    setSaveStatus: (saveStatus: SaveStatus) => void;
    setContactMethods: (contactMethods: StoreUserContactMethod[]) => void;
    setCurrencyExchanges: (currencyExchanges: StoreCurrencyExchange[]) => void;
    reset: () => void;
}

const useCurrencyExchangeStore = create<CurrencyExchangeStore>((set, _, store) => ({
    saveStatus: 'saved',
    contactMethods: [],
    currencyExchanges: [],

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
    reset: () => {
        set(store.getInitialState());
    },
}));

export default useCurrencyExchangeStore;