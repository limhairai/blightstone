"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface BillingInfo {
  customerId: string;
  paymentMethods: any[]; // Consider defining a specific type for payment methods
  invoices: any[]; // Consider defining a specific type for invoices
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
  updatePaymentMethod: (data: any) => Promise<void>; // Consider specific type for data
  updateSubscription: (plan: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth(); // Added session

  const fetchBilling = async () => {
    if (!user) { 
      setLoading(false); 
      // setError("User not authenticated"); // Optional: set error if user must be present
      return; 
    }
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await fetch('/api/proxy/v1/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || 'Failed to fetch billing info');
      }
      const data = await res.json();
      setBilling(data.billing || null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch billing info');
    }
    setLoading(false);
  };

  // Example: Fetch billing info when user session is available
  // useEffect(() => {
  //   if (user && session?.access_token) {
  //     fetchBilling();
  //   }
  // }, [user, session]); // Re-run if user or session changes

  const updatePaymentMethod = async (data: any) => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = session?.access_token;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await fetch('/api/proxy/v1/billing/payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || 'Failed to update payment method');
      }
      await fetchBilling(); // Refresh billing info
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
      const token = session?.access_token;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await fetch('/api/proxy/v1/billing/subscription', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || 'Failed to update subscription');
      }
      await fetchBilling(); // Refresh billing info
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
      const token = session?.access_token;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await fetch('/api/proxy/v1/billing/subscription', {
        method: 'PATCH', // Ensure backend handles PATCH for cancellation or use DELETE
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }), // Or whatever payload backend expects
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || 'Failed to cancel subscription');
      }
      await fetchBilling(); // Refresh billing info
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