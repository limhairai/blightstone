export type UserRole = 'admin' | 'manager' | 'member';

export type Permission = 
  | 'view_accounts'
  | 'manage_accounts'
  | 'view_analytics'
  | 'manage_analytics'
  | 'view_users'
  | 'manage_users'
  | 'view_settings'
  | 'manage_settings'
  | 'manage_team_settings'
  | 'manage_team_billing'
  | 'view_team_billing'
  | 'top_up_balance'
  | 'manage_subscription';

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role: string;
  is_superuser: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: {
    [userId: string]: {
      role: UserRole;
      joinedAt: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}

export const defaultRolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view_accounts',
    'manage_accounts',
    'view_analytics',
    'manage_analytics',
    'view_users',
    'manage_users',
    'view_settings',
    'manage_settings',
    'manage_team_settings',
    'manage_team_billing',
    'view_team_billing',
    'top_up_balance',
    'manage_subscription'
  ],
  manager: [
    'view_accounts',
    'manage_accounts',
    'view_analytics',
    'manage_analytics',
    'view_users',
    'view_settings',
    'manage_team_settings',
    'view_team_billing',
    'top_up_balance'
  ],
  member: [
    'view_accounts',
    'view_analytics',
    'view_settings',
    'top_up_balance'
  ]
}; 