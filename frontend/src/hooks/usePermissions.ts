import { useAuth } from "../contexts/AuthContext"
import useSWR from 'swr';
import { useOrganizationStore } from "../lib/stores/organization-store";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePermissions() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();

  const { data: orgData, isLoading: isOrgLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );
  
  const { data: teamData, isLoading: areMembersLoading } = useSWR(
    currentOrganizationId ? `/api/teams/members?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  const isLoading = isUserLoading || isOrgLoading || areMembersLoading;
  
  const currentOrganization = orgData?.organizations?.[0];
  const teamMembers = teamData?.members || [];

  const isAppAdmin = user?.app_metadata?.claims_admin === true;
  
  const currentUserMember = teamMembers.find(m => m.user_id === user?.id);
  const orgRole = currentUserMember?.role || null;

  const isOrgOwner = orgRole === 'owner';
  const isOrgAdmin = orgRole === 'admin';
  const canManageTeam = isOrgOwner || isOrgAdmin;

  const permissions = {
    isLoading,
    // App-level permissions
    isAppAdmin,
    canViewAdmin: isAppAdmin,
    
    // Organization-level permissions
    isOrgOwner,
    isOrgAdmin,
    canManageTeam,
    orgRole,
    
    // User info
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.full_name,
    
    // Organization info
    orgId: currentOrganization?.id,
    orgName: currentOrganization?.name,
    
    // Team info
    teamMembers,
    
    // Permission helpers
    canInviteMembers: canManageTeam,
    canRemoveMembers: canManageTeam,
    canEditOrg: isOrgOwner || isOrgAdmin,
    canViewBilling: isOrgOwner || isOrgAdmin,
    
    // Check if user has specific role
    hasRole: (role: 'owner' | 'admin' | 'member') => orgRole === role,
    
    // Check if user has at least a certain role level
    hasMinRole: (minRole: 'owner' | 'admin' | 'member') => {
      const roleHierarchy = { owner: 3, admin: 2, member: 1 };
      const userLevel = roleHierarchy[orgRole as keyof typeof roleHierarchy] || 0;
      const minLevel = roleHierarchy[minRole];
      return userLevel >= minLevel;
    }
  };

  return permissions;
} 