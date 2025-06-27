import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

interface OrganizationState {
  currentOrganizationId: string | null;
  setCurrentOrganizationId: (orgId: string | null) => void;
  onboardingDismissed: boolean;
  setOnboardingDismissed: (dismissed: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrganizationId: null,
      setCurrentOrganizationId: (orgId) => set({ currentOrganizationId: orgId }),
      onboardingDismissed: false,
      setOnboardingDismissed: (dismissed) => set({ onboardingDismissed: dismissed }),
    }),
    {
      name: 'organization-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
); 