"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  [key: string]: any;
}

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  markAsRead: (id: string) => Promise<void>;
  dismiss: (id: string) => void;
  show: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const token = session?.access_token;
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        const res = await fetch('/api/proxy/v1/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch notifications');
    }
    setLoading(false);
  };

  // useEffect(() => {
  //   fetchNotifications(); // Temporarily commented out to prevent 404s if endpoint doesn't exist
  // }, []); // Or [user] if it depended on user

  const refresh = fetchNotifications;

  const markAsRead = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const token = session?.access_token;
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        const res = await fetch('/api/proxy/v1/notifications/' + id + '/read', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to mark as read');
        await fetchNotifications();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to mark as read');
    }
    setLoading(false);
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const show = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    setLoading(true);
    setError(null);
    try {
      if (user) {
        const token = session?.access_token;
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }
        const res = await fetch('/api/proxy/v1/notifications', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(notification),
        });
        if (!res.ok) throw new Error('Failed to show notification');
        await fetchNotifications();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to show notification');
    }
    setLoading(false);
  };

  const value: NotificationContextType = {
    notifications,
    loading,
    error,
    refresh,
    markAsRead,
    dismiss,
    show,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}; 