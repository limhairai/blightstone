"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchSuperuserStatus = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem("adhub_token");
          const response = await fetch("/api/v1/auth/me", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    } else {
      setLoading(false);
      setIsSuperuser(false);
    }
  }, []);

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