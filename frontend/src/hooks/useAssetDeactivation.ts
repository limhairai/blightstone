import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationStore } from '@/lib/stores/organization-store';
import { invalidateAssetCache } from '@/lib/cache-invalidation';

interface UseAssetDeactivationProps {
  onSuccess?: () => void;
}

export function useAssetDeactivation({ onSuccess }: UseAssetDeactivationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const { mutate } = useSWRConfig();
  const { currentOrganizationId } = useOrganizationStore();



  const toggleAssetActivation = async (assetId: string, isActive: boolean) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);

    try {
      // OPTIMISTIC UPDATE: Show activation/deactivation immediately
      // Update ad accounts data
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/ad-accounts'),
        (currentData: any) => {
          if (currentData?.accounts) {
            return {
              ...currentData,
              accounts: currentData.accounts.map((account: any) =>
                account.id === assetId || account.asset_id === assetId
                  ? { ...account, is_active: isActive }
                  : account
              )
            };
          }
          return currentData;
        },
        false // Don't revalidate immediately
      );

      // Update business managers data
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/business-managers'),
        (currentData: any) => {
          if (Array.isArray(currentData)) {
            return currentData.map((bm: any) =>
              bm.id === assetId || bm.asset_id === assetId
                ? { ...bm, is_active: isActive }
                : bm
            );
          }
          if (currentData?.businesses) {
            return {
              ...currentData,
              businesses: currentData.businesses.map((bm: any) =>
                bm.id === assetId || bm.asset_id === assetId
                  ? { ...bm, is_active: isActive }
                  : bm
              )
            };
          }
          return currentData;
        },
        false // Don't revalidate immediately
      );

      // Make the actual API call
      const response = await fetch(`/api/assets/${assetId}/toggle-activation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update asset activation status');
      }

      const action = isActive ? 'activated' : 'deactivated';
      toast.success(`Asset ${action} successfully`);
      
      // COMPREHENSIVE CACHE INVALIDATION
      // This ensures all data sources see the updated asset state immediately
      if (currentOrganizationId) {
        invalidateAssetCache(currentOrganizationId);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error toggling asset activation:', error);
      toast.error('Failed to update asset status');
      
      // Revert optimistic update on error
      if (currentOrganizationId) {
        invalidateAssetCache(currentOrganizationId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleAssetActivation,
    isLoading,
  };
} 