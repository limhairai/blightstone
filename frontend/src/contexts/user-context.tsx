"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useAuth } from './AuthContext'; // Temporarily comment out for pure mock demo

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: Record<string, any>;
  walletBalance?: number; 
  initial?: string; 
  organizationName?: string; // Added for Topbar title
  [key: string]: any;
}

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MOCK_USER_PROFILE: UserProfile = {
  id: "mock-victor-id",
  email: "victor@example.com",
  displayName: "Victor",
  initial: "V",
  walletBalance: 15018.35,
  organizationName: "Startup Project" // Default org name for demo
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // const { user: firebaseUser } = useAuth(); // Temporarily comment out for pure mock demo
  
  // Initialize directly with mock data for demo purposes
  const [userProfile, setUserProfile] = useState<UserProfile | null>(MOCK_USER_PROFILE);
  const [loading, setLoading] = useState(false); // Set loading to false initially for mock
  const [error, setError] = useState<string | null>(null);

  // Simplified useEffect for demo - no actual fetching
  useEffect(() => {
    setUserProfile(MOCK_USER_PROFILE);
    setLoading(false);
  }, []);

  const refresh = () => {
    console.log("[UserContext] Mock refresh called.");
    setUserProfile(MOCK_USER_PROFILE); // Re-set to mock data
    setLoading(false);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    console.log("[UserContext] Mock updateProfile called with:", data);
    setUserProfile(prev => prev ? { ...prev, ...data } : null ); // Optimistically update mock
    // Simulate API call for demo
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log("[UserContext] Mock profile update successful.");
        resolve();
      }, 500);
    });
  };

  const value: UserContextType = {
    userProfile,
    loading,
    error,
    refresh,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}; 