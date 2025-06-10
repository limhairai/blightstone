"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SuperuserContextType {
  isSuperuser: boolean;
  loading: boolean;
  error: string | null;
}

const SuperuserContext = createContext<SuperuserContextType | undefined>(undefined);

interface SuperuserProviderProps {
  children: ReactNode;
}

export const SuperuserProvider = ({ children }: SuperuserProviderProps) => {
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    // Only make API call if user is authenticated and auth is not loading
    if (authLoading) {
      return; // Wait for auth to resolve
    }
    
    // If no user or session, set default values and stop loading
    if (!user || !session?.access_token) {
      setIsSuperuser(false);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchSuperuserStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/proxy/v1/auth/me", {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Failed to fetch user status" }));
          throw new Error(errorData.detail || "Failed to fetch user status");
        }
        
        const data = await response.json();
        setIsSuperuser(!!data.is_superuser);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
        setIsSuperuser(false); // Default to not superuser on error
      } finally {
        setLoading(false);
      }
    };

    fetchSuperuserStatus();
  }, [user, session?.access_token, authLoading]);

  const value: SuperuserContextType = {
    isSuperuser,
    loading,
    error,
  };

  return <SuperuserContext.Provider value={value}>{children}</SuperuserContext.Provider>;
};

export const useSuperuser = () => {
  const context = useContext(SuperuserContext);
  if (context === undefined) {
    throw new Error('useSuperuser must be used within a SuperuserProvider');
  }
  return context;
}; 