import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface OrganizationState {
  currentOrganizationId: string | null;
  currentOrganizationName: string | null;
  setCurrentOrganizationId: (id: string) => void;
  setCurrentOrganizationName: (name: string) => void;
  setOrganization: (id: string, name: string) => void;
  clearOrganization: () => void;
  onboardingDismissed: boolean;
  setOnboardingDismissed: (dismissed: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganizationId: null,
      currentOrganizationName: null,
      setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
      setCurrentOrganizationName: (name) => set({ currentOrganizationName: name }),
      setOrganization: (id, name) => set({ currentOrganizationId: id, currentOrganizationName: name }),
      clearOrganization: () => set({ currentOrganizationId: null, currentOrganizationName: null }),
      onboardingDismissed: false,
      setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),
    }),
    {
      name: 'organization-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
); 