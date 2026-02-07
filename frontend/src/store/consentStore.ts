import { create } from 'zustand';

interface ConsentStore {
  consentModalOpen: boolean;
  setConsentModalOpen: (open: boolean) => void;
}

export const useConsentStore = create<ConsentStore>((set) => ({
  consentModalOpen: false,
  setConsentModalOpen: (open) => set({ consentModalOpen: open }),
}));
