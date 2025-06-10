"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
  status: string;
  spendLimit: number;
  balance: number;
  dateAdded: string;
  [key: string]: any;
}

interface AdAccountContextType {
  adAccounts: AdAccount[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  createAdAccount: (data: Partial<AdAccount>) => Promise<void>;
  updateAdAccount: (id: string, data: Partial<AdAccount>) => Promise<void>;
  archiveAdAccount: (id: string) => Promise<void>;
  tagAdAccount: (id: string, tags: string[]) => Promise<void>;
  syncAdAccount: (id: string) => Promise<void>;
}

const AdAccountContext = createContext<AdAccountContextType | undefined>(undefined);

function isPublicOrAuthPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/login" || pathname === "/register";
}

export const AdAccountProvider = ({ children }: { children: ReactNode }) => {
  const { user, session, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdAccounts = async () => {
    // Don't fetch if no user or session
    if (!user || !session?.access_token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/ad-accounts', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setAdAccounts(data.adAccounts || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch ad accounts');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      return;
    }

    // Don't fetch if no user or no session
    if (!user || !session?.access_token) {
      setAdAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Don't fetch if we're on a public page (landing, login, register)
    if (pathname && isPublicOrAuthPage(pathname)) {
      setAdAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }

    fetchAdAccounts();
  }, [user, session?.access_token, authLoading, pathname]);

  const refresh = fetchAdAccounts;

  const createAdAccount = async (data: Partial<AdAccount>) => {
    if (!user || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/v1/ad-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create ad account');
      await fetchAdAccounts();
    } catch (e: any) {
      setError(e.message || 'Failed to create ad account');
    }
    setLoading(false);
  };

  const updateAdAccount = async (id: string, data: Partial<AdAccount>) => {
    if (!user || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/ad-accounts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update ad account');
      await fetchAdAccounts();
    } catch (e: any) {
      setError(e.message || 'Failed to update ad account');
    }
    setLoading(false);
  };

  const archiveAdAccount = async (id: string) => {
    if (!user || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/ad-accounts/${id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to archive ad account');
      await fetchAdAccounts();
    } catch (e: any) {
      setError(e.message || 'Failed to archive ad account');
    }
    setLoading(false);
  };

  const tagAdAccount = async (id: string, tags: string[]) => {
    if (!user || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/ad-accounts/${id}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error('Failed to tag ad account');
      await fetchAdAccounts();
    } catch (e: any) {
      setError(e.message || 'Failed to tag ad account');
    }
    setLoading(false);
  };

  const syncAdAccount = async (id: string) => {
    if (!user || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/v1/ad-accounts/${id}/sync-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to sync ad account');
      await fetchAdAccounts();
    } catch (e: any) {
      setError(e.message || 'Failed to sync ad account');
    }
    setLoading(false);
  };

  const value: AdAccountContextType = {
    adAccounts,
    loading,
    error,
    refresh,
    createAdAccount,
    updateAdAccount,
    archiveAdAccount,
    tagAdAccount,
    syncAdAccount,
  };

  return <AdAccountContext.Provider value={value}>{children}</AdAccountContext.Provider>;
};

export const useAdAccounts = () => {
  const ctx = useContext(AdAccountContext);
  if (!ctx) throw new Error('useAdAccounts must be used within an AdAccountProvider');
  return ctx;
}; 