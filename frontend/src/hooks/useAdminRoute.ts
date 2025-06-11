import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '../contexts/AppDataContext';

export function useAdminRoute() {
  const { canViewAdmin, loading } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !canViewAdmin) {
      router.replace('/dashboard');
    }
  }, [canViewAdmin, loading, router]);

  return { canViewAdmin, loading };
} 