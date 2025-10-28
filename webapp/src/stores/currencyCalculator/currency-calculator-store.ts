import { create } from 'zustand';

interface CurrencyCalculatorResultsStore {
  amountInSelectedCurrencyFrom: number;
  amountInSelectedCurrencyTo: number;
  fromCurrencyName: string;
  toCurrencyName: string;
  exchangeRate: number;
}

interface CurrencyCalculatorStore {
  currencyCalculatorResults: CurrencyCalculatorResultsStore;

  setCurrencyCalculatorResults: (results: CurrencyCalculatorResultsStore) => void;

  reset: () => void;
}

const useCurrencyCalculatorStore = create<CurrencyCalculatorStore>((set, _, store) => ({
  currencyCalculatorResults: {
    amountInSelectedCurrencyFrom: 0,
    amountInSelectedCurrencyTo: 0,
    fromCurrencyName: '',
    toCurrencyName: '',
    exchangeRate: 0,
  },

  setCurrencyCalculatorResults: (currencyCalculatorResults: CurrencyCalculatorResultsStore) => set(() => ({ currencyCalculatorResults })),

  reset: () => {
    set(store.getInitialState());
  },
}));

export default useCurrencyCalculatorStore;
