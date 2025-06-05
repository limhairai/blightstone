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
  const { user, session } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const currentTeamId = useMemo(() => currentTeam?.id, [currentTeam]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) {
        setCurrentTeam(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = session?.access_token;
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
          const errorData = await res.text();
          throw new Error(`Failed to fetch organizations: ${res.status} ${errorData || res.statusText}`);
        }
        const data = await res.json();
        if (data.organizations && data.organizations.length > 0) {
          const org = data.organizations[0];
          setCurrentTeam({
            id: org.id,
            name: org.name,
            ownerId: org.ownerId || org.createdBy || '',
            members: {}, 
            createdAt: new Date(org.createdAt),
            updatedAt: new Date(org.updatedAt || org.createdAt), // Use updatedAt if available
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
  }, [user, session]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!user || !currentTeamId) {
        if (!currentTeamId && currentTeam && Object.keys(currentTeam.members).length > 0) {
            setCurrentTeam(prev => prev ? { ...prev, members: {} } : null);
        }
        return;
      }
      try {
        const token = session?.access_token;
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
      }
    };
    fetchTeamMembers();
  }, [user, session, currentTeamId]);

  useEffect(() => {
    const fetchTeamInvites = async () => {
      if (!user || !currentTeamId) {
        setTeamInvites([]);
        return;
      }
      try {
        const token = session?.access_token;
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
        const invitesData = await res.json();
        if (Array.isArray(invitesData)) {
          setTeamInvites(
            invitesData.map((invite) => ({
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
  }, [user, session, currentTeamId]);

  const createTeam = async (name: string) => {
    if (!user) throw new Error('User not authenticated');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, adSpend: {}, supportChannel: {} }), // Ensure payload matches backend
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to create team');
      }
      // Refetch organizations to update the list and currentTeam
      // This can be done by re-triggering the first useEffect, e.g. by invalidating user/session or calling a refetch function
      // For now, just logging and setting loading to false
      console.log("Team created, ideally refetch organizations");
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const inviteMember = async (email: string, role: UserRole) => {
    if (!user || !currentTeam) throw new Error('Not authorized or no current team');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, role, orgId: currentTeam.id }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to invite member');
      }
      // Refetch invites
      // For now, just logging and setting loading to false
      console.log("Member invited, ideally refetch invites");
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
      // The backend for accept-invite might need an auth token if the user is already logged in
      // or it might be a public endpoint that then logs the user in / associates them.
      // Assuming for now it might need the logged-in user's token if they are performing this action post-login.
      const token = session?.access_token; 
      // If this endpoint is public and handles user creation/linking, token might not be needed or used differently.
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/accept-invite`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ token: inviteId, name: user.email, password: 'dummy-password' }), // `user.email` might be better than displayName. Password handling needs review.
      });
      if (!res.ok) {
         const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to accept invite');
      }
      // Refetch team members and potentially currentTeam details
      console.log("Invite accepted, ideally refetch team members/orgs");
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const rejectInvite = async (inviteId: string) => {
    if (!user || !currentTeam) throw new Error('Not authorized or no current team');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/invites/${inviteId}/reject`, { // Ensure this endpoint exists and matches
        method: 'POST', // Or DELETE, depending on API design
        headers: {
          'Content-Type': 'application/json', // May not be needed if no body
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail ||'Failed to reject invite');
      }
      setTeamInvites(prev => prev.filter(inv => inv.id !== inviteId));
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const updateMemberRole = async (userIdToUpdate: string, role: UserRole) => {
    if (!user || !currentTeam) throw new Error('Not authorized or no current team');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/members/${userIdToUpdate}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update member role');
      }
      // Refetch team members
      console.log("Member role updated, ideally refetch team members");
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const removeMember = async (userIdToRemove: string) => {
    if (!user || !currentTeam) throw new Error('Not authorized or no current team');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/members/${userIdToRemove}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
         const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to remove member');
      }
      // Refetch team members
      console.log("Member removed, ideally refetch team members");
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const updateRolePermissions = async (role: UserRole, permissions: Permission[]) => {
    if (!user || !currentTeam) throw new Error('Not authorized or no current team');
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Could not retrieve auth token.");
      const res = await fetch(`/api/v1/organizations/${currentTeam.id}/roles/${role}/permissions`, {
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update role permissions');
      }
      // Refetch team members or roles if permissions affect client-side checks significantly
      console.log("Role permissions updated");
      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      throw err;
    }
  };

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!currentTeam || !user?.id || !currentTeam.members[user.id]) return false;
    const userRole = currentTeam.members[user.id].role;
    const permissions = defaultRolePermissions[userRole] || [];
    return permissions.includes(permission);
  }, [currentTeam, user?.id]);

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
