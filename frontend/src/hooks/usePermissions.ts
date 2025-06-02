import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { Permission, UserRole } from '@/types/user';

// Define role-based permissions
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_accounts',
    'manage_accounts',
    'view_analytics',
    'manage_analytics',
    'view_users',
    'manage_users',
    'view_settings',
    'manage_settings'
  ],
  manager: [
    'view_accounts',
    'manage_accounts',
    'view_analytics',
    'manage_analytics',
    'view_users',
    'view_settings'
  ],
  member: [
    'view_accounts',
    'view_analytics',
    'view_settings'
  ]
};

export function usePermissions() {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !currentTeam) return false;

    const userRole = currentTeam.members[user.uid]?.role;
    if (!userRole) return false;

    return rolePermissions[userRole].includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const getUserRole = (): UserRole | null => {
    if (!user || !currentTeam) return null;
    return currentTeam.members[user.uid]?.role || null;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole
  };
} 