"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface AnalyticsData {
  [key: string]: any;
}

interface AnalyticsContextType {
  analytics: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchReport: (params?: Record<string, any>) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchAnalytics = async (params?: Record<string, any>) => {
    if (!user) { setLoading(false); setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      let url = '/api/proxy/v1/analytics';
      if (params) {
        const query = new URLSearchParams(params as any).toString();
        url += `?${query}`;
      }
      const token = session?.access_token;
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        setLoading(false);
        return;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const fetchedData = await res.json();
      setAnalytics(fetchedData.data || null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch analytics');
    }
    setLoading(false);
  };

  // useEffect(() => {
  //   if (user) { // Temporarily commented out
  //       fetchAnalytics({ /* default params if any */ });
  //   }
  // }, [user]);

  const refresh = fetchAnalytics;
  const fetchReport = fetchAnalytics;

  const value: AnalyticsContextType = {
    analytics,
    loading,
    error,
    refresh,
    fetchReport,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
};

export const useAnalytics = () => {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('useAnalytics must be used within an AnalyticsProvider');
  return ctx;
}; 