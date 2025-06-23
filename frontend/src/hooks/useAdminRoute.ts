import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from "../contexts/AppDataContext"

export function useAdminRoute() {
  const { state } = useAppData();
  const router = useRouter();
  
  // Simple admin check - in demo mode, always allow admin access
  // In production, this would check actual user permissions
  const canViewAdmin = state.dataSource === 'demo' || state.userProfile?.email === 'admin@adhub.tech';
  const loading = state.loading.organizations || state.loading.businesses;

  useEffect(() => {
    if (!loading && !canViewAdmin) {
      router.replace('/dashboard');
    }
  }, [canViewAdmin, loading, router]);

  return { canViewAdmin, loading };
} 