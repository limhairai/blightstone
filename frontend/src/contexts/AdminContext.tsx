"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTeam } from './TeamContext';
import { UserRole, Permission } from '@/types/user';

interface AdminStats {
  pendingRequests: number;
  totalClients: number;
  activeAdAccounts: number;
  totalRevenue: number;
  teamMembers: number;
  activeInvites: number;
}

interface AdminContextType {
  stats: AdminStats;
  loading: boolean;
  error: Error | null;
  refreshStats: () => Promise<void>;
  updateTeamRole: (userId: string, role: UserRole) => Promise<void>;
  updateTeamPermissions: (role: UserRole, permissions: Permission[]) => Promise<void>;
  removeTeamMember: (userId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { currentTeam, hasPermission } = useTeam();
  const [stats, setStats] = useState<AdminStats>({
    pendingRequests: 0,
    totalClients: 0,
    activeAdAccounts: 0,
    totalRevenue: 0,
    teamMembers: 0,
    activeInvites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!currentTeam || !hasPermission('view_analytics')) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('adhub_token');
      // Pending requests
      const reqRes = await fetch(`/api/v1/requests?orgId=${currentTeam.id}&status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const reqData = await reqRes.json();
      const pendingRequests = Array.isArray(reqData.requests) ? reqData.requests.length : 0;
      // Total clients
      const usersRes = await fetch(`/api/v1/organizations/${currentTeam.id}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const usersData = await usersRes.json();
      const totalClients = Array.isArray(usersData) ? usersData.length : 0;
      // Active ad accounts
      const adRes = await fetch(`/api/v1/ad-accounts?orgId=${currentTeam.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const adData = await adRes.json();
      const activeAdAccounts = Array.isArray(adData.adAccounts)
        ? adData.adAccounts.filter((a: any) => a.status === 'active').length
        : 0;
      // Total revenue
      const txRes = await fetch(`/api/v1/transactions?orgId=${currentTeam.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const txData = await txRes.json();
      const totalRevenue = Array.isArray(txData.transactions)
        ? txData.transactions.reduce((sum: number, t: any) => sum + (t.amount || t.netAmount || 0), 0)
        : 0;
      // Team members
      const teamMembers = Array.isArray(usersData) ? usersData.length : 0;
      // Active invites
      const invitesRes = await fetch(`/api/v1/invites/${currentTeam.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const invitesData = await invitesRes.json();
      const activeInvites = Array.isArray(invitesData) ? invitesData.length : 0;
      setStats({
        pendingRequests,
        totalClients,
        activeAdAccounts,
        totalRevenue,
        teamMembers,
        activeInvites,
      });
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Optionally, poll every X seconds for near real-time updates
    // const interval = setInterval(fetchStats, 30000);
    // return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTeam, hasPermission]);

  const updateTeamRole = async (userId: string, role: UserRole) => {
    if (!currentTeam || !hasPermission('manage_users')) {
      throw new Error('Not authorized');
    }
    const token = localStorage.getItem('adhub_token');
    try {
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ org_id: currentTeam.id, user_id: userId, role }),
      });
      if (!res.ok) throw new Error('Failed to update member role');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateTeamPermissions = async (role: UserRole, permissions: Permission[]) => {
    if (!currentTeam || !hasPermission('manage_settings')) {
      throw new Error('Not authorized');
    }
    const token = localStorage.getItem('adhub_token');
    try {
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ org_id: currentTeam.id, user_id: null, role, permissions }),
      });
      if (!res.ok) throw new Error('Failed to update role permissions');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const removeTeamMember = async (userId: string) => {
    if (!currentTeam || !hasPermission('manage_users')) {
      throw new Error('Not authorized');
    }
    const token = localStorage.getItem('adhub_token');
    try {
      const res = await fetch(`/api/v1/organizations/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, orgId: currentTeam.id }),
      });
      if (!res.ok) throw new Error('Failed to remove member');
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const value = {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
    updateTeamRole,
    updateTeamPermissions,
    removeTeamMember,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 