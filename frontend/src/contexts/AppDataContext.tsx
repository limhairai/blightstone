"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePathname } from 'next/navigation';
import { MOCK_FINANCIAL_DATA } from '../lib/mock-data';

// Types
interface Organization {
  id: string;
  name: string;
  owner_id: string;
  balance?: number;
  verification_status?: string;
  created_at: string;
  updated_at: string;
}

interface TeamMember {
  user_id: string;
  email: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

interface AppUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'client' | 'admin'; // App-level role
  is_superuser: boolean;
}

interface AppDataContextType {
  // User data
  appUser: AppUser | null;
  
  // Organizations
  organizations: Organization[];
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization | null) => void;
  
  // Team members for current org
  teamMembers: TeamMember[];
  
  // Permissions
  isAppAdmin: boolean;
  isOrgOwner: boolean;
  isOrgAdmin: boolean;
  canManageTeam: boolean;
  canViewAdmin: boolean;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  createOrganization: (name: string) => Promise<void>;
  inviteTeamMember: (email: string, role: TeamMember['role']) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

function isPublicOrAuthPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/onboarding";
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();
  const pathname = usePathname();
  
  // State
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    if (!session?.access_token) return null;
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    const headers = getAuthHeaders();
    if (!headers || !user) return null;

    try {
      const response = await fetch('/api/proxy/users/profile', { headers });
      if (response.ok) {
        const profile = await response.json();
        return {
          id: profile.id || user.id,
          email: profile.email || user.email,
          name: profile.name,
          avatar_url: profile.avatar_url,
          role: profile.role || 'client',
          is_superuser: profile.is_superuser || false
        };
      } else if (response.status === 404) {
        // Profile endpoint not found, use auth data silently
        console.debug('Profile endpoint not available, using auth data');
      } else {
        console.warn('Could not fetch user profile:', response.status, response.statusText);
      }
    } catch (err) {
      console.debug('Could not fetch user profile, using auth data:', err);
    }

    // Fallback to auth user data
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
      role: 'client' as const,
      is_superuser: false
    };
  };

  // Fetch organizations
  const fetchOrganizations = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      console.log('AppDataContext: No auth headers available for organizations fetch');
      return [];
    }

    try {
      console.log('AppDataContext: Fetching organizations...');
      const response = await fetch('/api/proxy/organizations', { headers });
      
      if (response.ok) {
        const data = await response.json();
        const orgs = Array.isArray(data) ? data : data.organizations || [];
        console.log('AppDataContext: Successfully fetched', orgs.length, 'organizations');
        
        // Apply consistent mock balance to all organizations
        return orgs.map((org: Organization) => ({
          ...org,
          balance: MOCK_FINANCIAL_DATA.walletBalance
        }));
      } else {
        console.error('AppDataContext: Failed to fetch organizations:', response.status, response.statusText);
        if (response.status === 401) {
          console.error('AppDataContext: Authentication failed - user may need to re-login');
        }
      }
    } catch (err) {
      console.error('AppDataContext: Network error fetching organizations:', err);
    }
    return [];
  };

  // Fetch team members for current org
  const fetchTeamMembers = async (orgId: string) => {
    const headers = getAuthHeaders();
    if (!headers || !orgId) return [];

    try {
      const response = await fetch(`/api/proxy/organizations/${orgId}/members`, { headers });
      if (response.ok) {
        const members = await response.json();
        return Array.isArray(members) ? members : [];
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
    return [];
  };

  // Main data fetching function
  const refreshData = async () => {
    if (!user || !session?.access_token) {
      setAppUser(null);
      setOrganizations([]);
      setCurrentOrgState(null);
      setTeamMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch user profile and organizations in parallel
      const [userProfile, orgs] = await Promise.all([
        fetchUserProfile().catch((err) => {
          console.error('AppDataContext: Failed to fetch user profile:', err);
          return null; // Return null instead of throwing
        }),
        fetchOrganizations().catch((err) => {
          console.error('AppDataContext: Failed to fetch organizations:', err);
          return []; // Return empty array instead of throwing
        })
      ]);

      setAppUser(userProfile);
      setOrganizations(orgs);

      // Set current org (from localStorage or first org)
      let selectedOrg = null;
      if (orgs.length > 0) {
        const storedOrgId = localStorage.getItem('adhub_current_org_id');
        selectedOrg = orgs.find((org: Organization) => org.id === storedOrgId) || orgs[0];
        
        // Ensure the selected org has the consistent mock balance
        selectedOrg = {
          ...selectedOrg,
          balance: MOCK_FINANCIAL_DATA.walletBalance
        };
        
        setCurrentOrgState(selectedOrg);
        localStorage.setItem('adhub_current_org_id', selectedOrg.id);

        // Fetch team members for current org
        try {
          const members = await fetchTeamMembers(selectedOrg.id);
          setTeamMembers(members);
        } catch (err) {
          console.error('AppDataContext: Failed to fetch team members:', err);
          setTeamMembers([]); // Set empty array instead of crashing
        }
      } else {
        setCurrentOrgState(null);
        setTeamMembers([]);
        localStorage.removeItem('adhub_current_org_id');
      }

    } catch (err) {
      console.error('AppDataContext: Unexpected error in refreshData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load app data');
    } finally {
      setLoading(false);
    }
  };

  // Set current organization
  const setCurrentOrg = (org: Organization | null) => {
    if (org) {
      // Ensure consistent mock balance
      const orgWithBalance = {
        ...org,
        balance: MOCK_FINANCIAL_DATA.walletBalance
      };
      setCurrentOrgState(orgWithBalance);
      localStorage.setItem('adhub_current_org_id', org.id);
    } else {
      setCurrentOrgState(null);
      localStorage.removeItem('adhub_current_org_id');
    }
  };

  // Create organization
  const createOrganization = async (name: string) => {
    const headers = getAuthHeaders();
    if (!headers) throw new Error('Not authenticated');

    const response = await fetch('/api/proxy/organizations', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    await refreshData();
  };

  // Invite team member
  const inviteTeamMember = async (email: string, role: TeamMember['role']) => {
    const headers = getAuthHeaders();
    if (!headers || !currentOrg || !currentOrg.id) throw new Error('Not authenticated or no organization selected');

    const response = await fetch(`/api/proxy/organizations/${currentOrg.id}/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, role })
    });

    if (!response.ok) {
      throw new Error('Failed to invite team member');
    }

    // Refresh team members
    const members = await fetchTeamMembers(currentOrg.id);
    setTeamMembers(members);
  };

  // Load data when auth state changes
  useEffect(() => {
    if (!authLoading && user && session?.access_token) {
      console.log('AppDataContext: Refreshing data for authenticated user');
      refreshData().catch((err) => {
        console.error('AppDataContext: Failed to refresh data:', err);
        // Don't crash the app, just log the error
      });
    } else if (!user || !session?.access_token) {
      console.log('AppDataContext: Clearing data for unauthenticated user');
      setAppUser(null);
      setOrganizations([]);
      setCurrentOrgState(null);
      setTeamMembers([]);
      setLoading(false);
      setError(null);
    }
  }, [user, session?.access_token, authLoading]);

  // Computed permissions
  const isAppAdmin = appUser?.role === 'admin' || appUser?.is_superuser || false;
  const isOrgOwner = currentOrg && appUser ? currentOrg.owner_id === appUser.id : false;
  const isOrgAdmin = teamMembers.some(member => 
    member.user_id === appUser?.id && (member.role === 'admin' || member.role === 'owner')
  );
  const canManageTeam = isOrgOwner || isOrgAdmin;
  const canViewAdmin = isAppAdmin;

  const value: AppDataContextType = {
    // User data
    appUser,
    
    // Organizations
    organizations,
    currentOrg,
    setCurrentOrg,
    
    // Team members
    teamMembers,
    
    // Permissions
    isAppAdmin,
    isOrgOwner,
    isOrgAdmin,
    canManageTeam,
    canViewAdmin,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshData,
    createOrganization,
    inviteTeamMember
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
} 