import { useAppData } from '@/contexts/AppDataContext';

export function usePermissions() {
  const { 
    isAppAdmin, 
    isOrgOwner, 
    isOrgAdmin, 
    canManageTeam, 
    canViewAdmin,
    appUser,
    currentOrg,
    teamMembers
  } = useAppData();

  // Get current user's role in the organization
  const currentUserMember = teamMembers.find(m => m.user_id === appUser?.id);
  const orgRole = currentUserMember?.role || null;

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
    userId: appUser?.id,
    userEmail: appUser?.email,
    userName: appUser?.name,
    
    // Organization info
    orgId: currentOrg?.id,
    orgName: currentOrg?.name,
    
    // Team info
    teamMembers,
    
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