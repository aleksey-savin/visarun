import { create } from 'zustand';

interface ClientSearchStore {
  isClientSearchOpen: boolean;

  setIsClientSearchOpen: (isClientSearchOpen: boolean) => void;

  reset: () => void;
}

const useClientSearchStore = create<ClientSearchStore>((set, _, store) => ({
  isClientSearchOpen: false,

  setIsClientSearchOpen: (isClientSearchOpen: boolean) => set(() => ({ isClientSearchOpen })),

  reset: () => {
    set(store.getInitialState());
  },
}));

export default useClientSearchStore;
