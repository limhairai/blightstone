import { useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';
import { useAuth } from '@/contexts/AuthContext';

interface UseAssetDeactivationProps {
  onSuccess?: () => void;
}

export function useAssetDeactivation({ onSuccess }: UseAssetDeactivationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const toggleAssetActivation = async (assetId: string, isActive: boolean) => {
    console.log('🔄 toggleAssetActivation called with:', { assetId, isActive });
    
    if (!session?.access_token) {
      console.log('❌ No session token available');
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📡 Making API call to toggle activation...');
      const response = await fetch(`/api/assets/${assetId}/toggle-activation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to toggle asset activation');
      }

      const result = await response.json();
      
      // Show success message
      toast.success(result.message || `Asset ${isActive ? 'activated' : 'deactivated'} successfully`);
      
      // Invalidate relevant SWR caches
      console.log('Invalidating caches after asset deactivation...');
      
      // Invalidate all business managers caches
      await mutate((key) => {
        if (Array.isArray(key)) {
          return key[0] === '/api/business-managers';
        }
        return typeof key === 'string' && key.startsWith('/api/business-managers');
      });
      
      // Invalidate all ad accounts caches
      await mutate((key) => {
        if (Array.isArray(key)) {
          return key[0] === '/api/ad-accounts' || key[0]?.startsWith('/api/ad-accounts');
        }
        return typeof key === 'string' && key.startsWith('/api/ad-accounts');
      });
      
      // Invalidate subscriptions cache
      await mutate((key) => {
        if (Array.isArray(key)) {
          return key[0] === '/api/subscriptions/current';
        }
        return typeof key === 'string' && key.startsWith('/api/subscriptions/current');
      });
      
      console.log('Cache invalidation completed');
      
      // Call success callback
      onSuccess?.();
      
      return result;
    } catch (error) {
      console.error('Error toggling asset activation:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateAsset = (assetId: string) => toggleAssetActivation(assetId, false);
  const activateAsset = (assetId: string) => toggleAssetActivation(assetId, true);

  return {
    isLoading,
    toggleAssetActivation,
    deactivateAsset,
    activateAsset,
  };
} 