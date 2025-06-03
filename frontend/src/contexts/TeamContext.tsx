"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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

  // Memoize currentTeam ID to prevent unnecessary effect runs if only team members change
  const currentTeamId = useMemo(() => currentTeam?.id, [currentTeam]);

  // Fetch user's teams (organizations)
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) {
        setCurrentTeam(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await user.getIdToken();
        if (!token) {
          setCurrentTeam(null);
          setLoading(false);
          setError(new Error("Could not retrieve auth token."));
          return;
        }
        const res = await fetch(`/api/v1/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Handle non-OK responses, e.g., 401, 403, 404
          const errorData = await res.text(); // Or res.json() if API returns JSON errors
          throw new Error(`Failed to fetch organizations: ${res.status} ${errorData || res.statusText}`);
        }
        const data = await res.json();
        if (data.organizations && data.organizations.length > 0) {
          const org = data.organizations[0];
          setCurrentTeam({
            id: org.id,
            name: org.name,
            ownerId: org.ownerId || org.createdBy || '',
            members: {}, // Will be filled by the next effect
            createdAt: new Date(org.createdAt),
            updatedAt: new Date(), // This should likely be org.updatedAt if available
          });
        } else {
          setCurrentTeam(null);
        }
      } catch (err) {
        setError(err as Error);
        setCurrentTeam(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [user]);

  // Fetch team members if currentTeamId exists
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user || !currentTeamId) {
        if (!currentTeamId && currentTeam && Object.keys(currentTeam.members).length > 0) {
            setCurrentTeam(prev => prev ? { ...prev, members: {} } : null);
        }
        // No error setting here, just return if no user or team ID
        return;
      }
      // No setLoading(true) here as it might cause quick flashes if this runs frequently
      try {
        const token = await user.getIdToken();
        if (!token) {
          setError(new Error("Could not retrieve auth token for team members."));
          return;
        }
        const res = await fetch(`/api/v1/organizations/${currentTeamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to fetch team members: ${res.status} ${errorData || res.statusText}`);
        }
        const members = await res.json();
        if (Array.isArray(members)) {
          setCurrentTeam((prevTeam) =>
            prevTeam && prevTeam.id === currentTeamId
              ? {
                  ...prevTeam,
                  members: members.reduce((acc, m) => {
                    acc[m.userId] = {
                      role: m.role,
                      joinedAt: new Date(m.joinedAt),
                    };
                    return acc;
                  }, {} as Team['members']),
                }
              : prevTeam
          );
        }
      } catch (err) {
        setError(err as Error);
        // Optionally clear members on error: setCurrentTeam(prev => prev ? { ...prev, members: {} } : null);
      }
      // No setLoading(false) here unless there was a setLoading(true)
    };
    fetchTeamMembers();
  }, [user, currentTeamId]); // Removed currentTeam from deps as members are part of it; currentTeamId covers team changes

  // Fetch invites for the current org
  useEffect(() => {
    const fetchTeamInvites = async () => {
      if (!user || !currentTeamId) {
        setTeamInvites([]);
        return;
      }
      try {
        const token = await user.getIdToken();
        if (!token) {
          setError(new Error("Could not retrieve auth token for invites."));
          setTeamInvites([]);
          return;
        }
        const res = await fetch(`/api/v1/invites/${currentTeamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(`Failed to fetch invites: ${res.status} ${errorData || res.statusText}`);
        }
        const invites = await res.json();
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
        } else {
          setTeamInvites([]);
        }
      } catch (err) {
        setError(err as Error);
        setTeamInvites([]);
      }
    };
    fetchTeamInvites();
  }, [user, currentTeamId]);

  const createTeam = async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/invites/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    if (!user || !currentTeam) throw new Error('Not authorized or no team selected');
    setLoading(true);
    let token;
    try {
      token = await user.getIdToken();
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ org_id: currentTeam.id, role, permissions }),
      });
      if (!res.ok) throw new Error('Failed to update role permissions');
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentTeam || !user?.uid || !currentTeam.members[user.uid]) return false;
    const userRole = currentTeam.members[user.uid].role;
    const permissions = defaultRolePermissions[userRole] || [];
    return permissions.includes(permission);
  }, [currentTeam, user?.uid]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  }, [hasPermission]);

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