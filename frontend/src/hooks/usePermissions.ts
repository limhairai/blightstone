import { useAppData } from "../contexts/AppDataContext"
import { useAuth } from "../contexts/AuthContext"

export function usePermissions() {
  const { state } = useAppData();
  const { user } = useAuth();

  // Simple permission logic for demo mode
  const isAppAdmin = state.dataSource === 'demo' || user?.email === 'admin@adhub.tech';
  const isOrgOwner = true; // In demo mode, user is always owner
  const isOrgAdmin = true; // In demo mode, user is always admin
  const canManageTeam = true; // In demo mode, user can manage team
  const canViewAdmin = isAppAdmin;

  // Get current user's role in the organization
  const currentUserMember = state.teamMembers.find(m => m.email === user?.email);
  const orgRole = currentUserMember?.role || 'owner';

  return {
    // App-level permissions
    isAppAdmin,
    canViewAdmin,
    
    // Organization-level permissions
    isOrgOwner,
    isOrgAdmin,
    canManageTeam,
    orgRole,
    
    // User info
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.user_metadata?.name || state.userProfile?.name,
    
    // Organization info
    orgId: state.currentOrganization?.id,
    orgName: state.currentOrganization?.name,
    
    // Team info
    teamMembers: state.teamMembers,
    
    // Permission helpers
    canInviteMembers: canManageTeam,
    canRemoveMembers: canManageTeam,
    canEditOrg: isOrgOwner || isOrgAdmin,
    canViewBilling: isOrgOwner || isOrgAdmin,
    canManageUsers: canManageTeam,
    canManageBilling: canManageTeam,
    canManageBusinesses: canManageTeam,
    canManageAdAccounts: canManageTeam,
    
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
} 