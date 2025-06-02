"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Team, TeamInvite, UserRole, Permission, defaultRolePermissions } from '@/types/user';

interface TeamContextType {
  currentTeam: Team | null;
  teamInvites: TeamInvite[];
  loading: boolean;
  error: Error | null;
  createTeam: (name: string) => Promise<void>;
  inviteMember: (email: string, role: UserRole) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  rejectInvite: (inviteId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: UserRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateRolePermissions: (role: UserRole, permissions: Permission[]) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const TeamContext = createContext<TeamContextType | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user's teams (organizations)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/v1/organizations`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations && data.organizations.length > 0) {
          // Map backend org to Team type
          const org = data.organizations[0];
          setCurrentTeam({
            id: org.id,
            name: org.name,
            ownerId: org.ownerId || org.createdBy || '',
            members: {}, // Will be filled below
            createdAt: new Date(org.createdAt),
            updatedAt: new Date(),
          });
        } else {
          setCurrentTeam(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [user]);

  // Fetch team members if currentTeam exists
  useEffect(() => {
    if (!user || !currentTeam) return;
    fetch(`/api/v1/organizations/${currentTeam.id}/members`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((members) => {
        if (Array.isArray(members)) {
          setCurrentTeam((prev) =>
            prev
              ? {
                  ...prev,
                  members: members.reduce((acc, m) => {
                    acc[m.userId] = {
                      role: m.role,
                      joinedAt: new Date(m.joinedAt),
                    };
                    return acc;
                  }, {} as Team['members']),
                }
              : null
          );
        }
      })
      .catch((err) => setError(err));
  }, [user, currentTeam?.id]);

  // Fetch invites for the current org
  useEffect(() => {
    if (!user || !currentTeam) return;
    fetch(`/api/v1/invites/${currentTeam.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then((res) => res.json())
      .then((invites) => {
        if (Array.isArray(invites)) {
          setTeamInvites(
            invites.map((invite) => ({
              id: invite.token || invite.id,
              teamId: invite.orgId,
              email: invite.email,
              role: invite.role,
              invitedBy: invite.invitedBy || '',
              status: invite.status,
              createdAt: new Date(invite.createdAt),
              expiresAt: new Date(invite.expiresAt),
            }))
          );
        }
      })
      .catch((err) => setError(err));
  }, [user, currentTeam?.id]);

  const createTeam = async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name, adSpend: {}, supportChannel: {} }),
      });
      if (!res.ok) throw new Error('Failed to create team');
      const data = await res.json();
      // Refetch teams
      setLoading(false);
      // Optionally, trigger a reload or refetch here
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const inviteMember = async (email: string, role: UserRole) => {
    if (!user || !currentTeam) throw new Error('Not authorized');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ email, role, orgId: currentTeam.id }),
      });
      if (!res.ok) throw new Error('Failed to invite member');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const acceptInvite = async (inviteId: string) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    try {
      // Accept invite endpoint expects token, name, password (simulate with user.displayName and a dummy password)
      const res = await fetch(`/api/v1/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: inviteId, name: user.displayName || '', password: 'dummy-password' }),
      });
      if (!res.ok) throw new Error('Failed to accept invite');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const rejectInvite = async (inviteId: string) => {
    if (!user || !currentTeam) throw new Error('Not authorized');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/invites/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ token: inviteId, orgId: currentTeam.id }),
      });
      if (!res.ok) throw new Error('Failed to reject invite');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const updateMemberRole = async (userId: string, role: UserRole) => {
    if (!user || !currentTeam) throw new Error('Not authorized');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ org_id: currentTeam.id, user_id: userId, role }),
      });
      if (!res.ok) throw new Error('Failed to update member role');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const removeMember = async (userId: string) => {
    if (!user || !currentTeam) throw new Error('Not authorized');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/organizations/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ userId, orgId: currentTeam.id }),
      });
      if (!res.ok) throw new Error('Failed to remove member');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const updateRolePermissions = async (role: UserRole, permissions: Permission[]) => {
    if (!user || !currentTeam) throw new Error('Not authorized');
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ org_id: currentTeam.id, user_id: user.uid, role, permissions }),
      });
      if (!res.ok) throw new Error('Failed to update role permissions');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  // Permission checks (use currentTeam.members and defaultRolePermissions)
  const hasPermission = (permission: Permission): boolean => {
    if (!user || !currentTeam) return false;
    const member = currentTeam.members[user.uid];
    if (!member) return false;
    const role = member.role;
    const perms = defaultRolePermissions[role] || [];
    return perms.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  const value = {
    currentTeam,
    teamInvites,
    loading,
    error,
    createTeam,
    inviteMember,
    acceptInvite,
    rejectInvite,
    updateMemberRole,
    removeMember,
    updateRolePermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
} 