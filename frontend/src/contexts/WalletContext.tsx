"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAppData } from "./AppDataContext";
import { useAuth } from "./AuthContext";

interface AdAccount {
  id: string;
  name: string;
  platform: 'facebook' | 'google' | 'tiktok';
  status: 'active' | 'inactive' | 'pending';
  balance: number;
  currency: string;
  last_sync: string;
}

interface WalletContextType {
  adAccounts: AdAccount[];
  totalBalance: number;
  loading: boolean;
  error: string | null;
  refreshAdAccounts: () => Promise<void>;
  addAdAccount: (account: Omit<AdAccount, 'id'>) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { currentOrg } = useAppData();
  const { session } = useAuth();
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    if (!session?.access_token) return null;
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const refreshAdAccounts = async () => {
    if (!currentOrg || !session?.access_token) {
      setAdAccounts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      if (!headers) throw new Error('Not authenticated');

      const response = await fetch(`/api/proxy/organizations/${currentOrg.id}/ad-accounts`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setAdAccounts(Array.isArray(data) ? data : data.adAccounts || []);
      } else {
        throw new Error('Failed to fetch ad accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ad accounts');
      setAdAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const addAdAccount = async (account: Omit<AdAccount, 'id'>) => {
    if (!currentOrg || !session?.access_token) {
      throw new Error('Not authenticated or no organization selected');
    }

    const headers = getAuthHeaders();
    if (!headers) throw new Error('Not authenticated');

    const response = await fetch('/api/proxy/ad-accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...account,
        orgId: currentOrg.id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to add ad account');
    }

    // Refresh the list
    await refreshAdAccounts();
  };

  // Calculate total balance
  const totalBalance = adAccounts.reduce((sum, account) => sum + account.balance, 0);

  // Load ad accounts when org changes
  useEffect(() => {
    refreshAdAccounts();
  }, [currentOrg, session?.access_token]);

  const value: WalletContextType = {
    adAccounts,
    totalBalance,
    loading,
    error,
    refreshAdAccounts,
    addAdAccount
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 