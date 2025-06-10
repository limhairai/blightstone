import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export function useAuthToken() {
  const { session } = useAuth();
  
  const token = useMemo(() => {
    return session?.access_token || null;
  }, [session?.access_token]);

  const authHeaders = useMemo(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  return {
    token,
    authHeaders,
    isAuthenticated: !!token
  };
} 