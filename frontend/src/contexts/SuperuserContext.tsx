"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { config, shouldUseMockData, isDemoMode } from '../lib/config';

interface SuperuserContextType {
  isSuperuser: boolean;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
}

const SuperuserContext = createContext<SuperuserContextType | undefined>(undefined);

interface SuperuserProviderProps {
  children: ReactNode;
}

// Cache key for session storage
const SUPERUSER_CACHE_KEY = 'adhub_superuser_status';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedSuperuserStatus {
  isSuperuser: boolean;
  timestamp: number;
  userId: string;
}

export const SuperuserProvider = ({ children }: SuperuserProviderProps) => {
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading: authLoading } = useAuth();

  // Check cache first
  const getCachedStatus = (userId: string): boolean | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(SUPERUSER_CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: CachedSuperuserStatus = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is valid (same user, not expired)
      if (parsedCache.userId === userId && (now - parsedCache.timestamp) < CACHE_DURATION) {
        console.log('SuperuserContext: Using cached superuser status:', parsedCache.isSuperuser);
        return parsedCache.isSuperuser;
      }
      
      // Cache expired or different user, remove it
      sessionStorage.removeItem(SUPERUSER_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('SuperuserContext: Error reading cache:', error);
      sessionStorage.removeItem(SUPERUSER_CACHE_KEY);
      return null;
    }
  };

  // Cache the status
  const setCachedStatus = (userId: string, status: boolean) => {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData: CachedSuperuserStatus = {
        isSuperuser: status,
        timestamp: Date.now(),
        userId: userId
      };
      sessionStorage.setItem(SUPERUSER_CACHE_KEY, JSON.stringify(cacheData));
      console.log('SuperuserContext: Cached superuser status:', status);
    } catch (error) {
      console.error('SuperuserContext: Error setting cache:', error);
    }
  };

  // Retry logic for network errors
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 2): Promise<Response> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error: any) {
        lastError = error;
        console.warn(`SuperuserContext: Fetch attempt ${attempt + 1} failed:`, error.message);
        
        // If it's a timeout or connection error, wait before retrying
        if (attempt < maxRetries && (
          error.message.includes('timeout') || 
          error.message.includes('handshake') ||
          error.message.includes('network') ||
          error.name === 'TypeError'
        )) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 3000); // Exponential backoff, max 3s
          console.log(`SuperuserContext: Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  };

  useEffect(() => {
    // In demo mode, always grant superuser access
    if (isDemoMode() || shouldUseMockData()) {
      console.log('SuperuserContext: Demo mode detected, granting superuser access');
      setIsSuperuser(true);
      setLoading(false);
      setError(null);
      return;
    }

    // Only make API call if user is authenticated and auth is not loading
    if (authLoading) {
      return; // Wait for auth to resolve
    }
    
    // If no user or session, clear cache and set default values
    if (!user || !session?.access_token) {
      // Clear cache when user logs out or session expires
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SUPERUSER_CACHE_KEY);
        console.log('SuperuserContext: Cleared cache due to logout/session expiry');
      }
      setIsSuperuser(false);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cachedStatus = getCachedStatus(user.id);
    if (cachedStatus !== null) {
      setIsSuperuser(cachedStatus);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchSuperuserStatus = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('SuperuserContext: Fetching fresh superuser status...');
        const response = await fetchWithRetry("/api/proxy/auth/me", {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: "Failed to fetch user status" }));
          throw new Error(errorData.detail || "Failed to fetch user status");
        }
        
        const data = await response.json();
        const superuserStatus = !!data.is_superuser;
        
        setIsSuperuser(superuserStatus);
        setCachedStatus(user.id, superuserStatus);
        
        console.log('SuperuserContext: Fresh superuser status fetched:', superuserStatus);
      } catch (err: any) {
        console.error('SuperuserContext: Error fetching superuser status:', err.message);
        
        // For network/timeout errors, try to use any existing cache as fallback
        if (err.message.includes('timeout') || err.message.includes('handshake') || err.message.includes('network')) {
          console.log('SuperuserContext: Network error detected, checking for any cached status...');
          
          try {
            const anyCached = sessionStorage.getItem(SUPERUSER_CACHE_KEY);
            if (anyCached) {
              const parsedCache: CachedSuperuserStatus = JSON.parse(anyCached);
              if (parsedCache.userId === user.id) {
                console.log('SuperuserContext: Using stale cache due to network error:', parsedCache.isSuperuser);
                setIsSuperuser(parsedCache.isSuperuser);
                setError(null); // Don't show error if we have fallback
                return;
              }
            }
          } catch (cacheError) {
            console.error('SuperuserContext: Error reading fallback cache:', cacheError);
          }
        }
        
        // If no cache fallback available, default to false but don't show error to user
        console.log('SuperuserContext: Defaulting to non-superuser due to error');
        setError(null); // Don't show error to user for network issues
        setIsSuperuser(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSuperuserStatus();
  }, [user, session?.access_token, authLoading]);

  // Manual refresh function
  const refreshStatus = async () => {
    // In demo mode, always return superuser status
    if (isDemoMode() || shouldUseMockData()) {
      setIsSuperuser(true);
      setLoading(false);
      setError(null);
      return;
    }

    if (!user || !session?.access_token) {
      console.log('SuperuserContext: Cannot refresh - no user or session');
      return;
    }

    // Clear cache and force fresh fetch
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SUPERUSER_CACHE_KEY);
      console.log('SuperuserContext: Manual refresh - cleared cache');
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('SuperuserContext: Manual refresh - fetching fresh status...');
      const response = await fetchWithRetry("/api/proxy/auth/me", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Failed to fetch user status" }));
        throw new Error(errorData.detail || "Failed to fetch user status");
      }
      
      const data = await response.json();
      const superuserStatus = !!data.is_superuser;
      
      setIsSuperuser(superuserStatus);
      setCachedStatus(user.id, superuserStatus);
      
      console.log('SuperuserContext: Manual refresh completed:', superuserStatus);
    } catch (err: any) {
      console.error('SuperuserContext: Manual refresh failed:', err.message);
      setError(err.message);
      setIsSuperuser(false);
    } finally {
      setLoading(false);
    }
  };

  const value: SuperuserContextType = {
    isSuperuser,
    loading,
    error,
    refreshStatus,
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