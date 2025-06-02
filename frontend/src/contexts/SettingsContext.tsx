"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface UserSettings {
  theme: string;
  language: string;
  [key: string]: any;
}

interface OrgSettings {
  notificationPreferences: any;
  [key: string]: any;
}

interface Settings {
  userSettings: UserSettings;
  orgSettings: OrgSettings;
}

interface SettingsContextType {
  userSettings: UserSettings | null;
  orgSettings: OrgSettings | null;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateUserSettings: (data: Partial<UserSettings>) => Promise<void>;
  updateOrgSettings: (data: Partial<OrgSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [orgSettings, setOrgSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setUserSettings(data.userSettings || null);
      setOrgSettings(data.orgSettings || null);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch settings');
    }
    setLoading(false);
  };

  // useEffect(() => {
  //   if (user) fetchSettings(); // Temporarily commented out
  // }, [user]);

  const updateUserSettings = async (data: Partial<UserSettings>) => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/settings/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update user settings');
      await fetchSettings();
    } catch (e: any) {
      setError(e.message || 'Failed to update user settings');
    }
    setLoading(false);
  };

  const updateOrgSettings = async (data: Partial<OrgSettings>) => {
    if (!user) { setError("User not authenticated"); return; }
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken(true);
      const res = await fetch('/api/proxy/v1/settings/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update org settings');
      await fetchSettings();
    } catch (e: any) {
      setError(e.message || 'Failed to update org settings');
    }
    setLoading(false);
  };

  const value = { userSettings, orgSettings, loading, error, fetchSettings, updateUserSettings, updateOrgSettings };
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
}; 