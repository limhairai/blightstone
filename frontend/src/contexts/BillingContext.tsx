"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface BillingInfo {
  customerId: string;
  paymentMethods: any[];
  invoices: any[];
  subscription: {
    plan: string;
    status: string;
    nextBillingDate: string;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

interface BillingContextType {
  billing: BillingInfo | null;
  loading: boolean;
  error: string | null;
  fetchBilling: () => Promise<void>;
  updatePaymentMethod: (data: any) => Promise<void>;
  updateSubscription: (plan: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchBilling = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch billing info');
      const data = await res.json();
      setBilling(data.billing || null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch billing info');
    }
    setLoading(false);
  };

  // useEffect(() => {
  //   if (user) fetchBilling(); // Temporarily commented out
  // }, [user]);

  const updatePaymentMethod = async (data: any) => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/billing/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update payment method');
      await fetchBilling();
    } catch (e: any) {
      setError(e.message || 'Failed to update payment method');
    }
    setLoading(false);
  };

  const updateSubscription = async (plan: string) => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error('Failed to update subscription');
      await fetchBilling();
    } catch (e: any) {
      setError(e.message || 'Failed to update subscription');
    }
    setLoading(false);
  };

  const cancelSubscription = async () => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to cancel subscription');
      await fetchBilling();
    } catch (e: any) {
      setError(e.message || 'Failed to cancel subscription');
    }
    setLoading(false);
  };

  const value: BillingContextType = {
    billing,
    loading,
    error,
    fetchBilling,
    updatePaymentMethod,
    updateSubscription,
    cancelSubscription,
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within a BillingProvider');
  return ctx;
}; 