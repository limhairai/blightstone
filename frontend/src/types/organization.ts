// Organization types matching actual database schema
export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  plan_id?: string;
  avatar_url?: string;
  balance?: number; // Deprecated - use wallet balance instead
  monthly_spent?: number;
  total_spent?: number;
  current_team_members_count: number;
  current_businesses_count: number;
  current_ad_accounts_count: number;
  current_monthly_spend_cents: number;
  ad_spend_monthly?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: string;
  last_payment_at?: string;
  created_at: string;
  updated_at: string;
}

// Wallet interface - simplified, always USD
export interface Wallet {
  id: string;
  organization_id: string;
  balance_cents: number;
  created_at: string;
  updated_at: string;
}

// Organization member interface
export interface OrganizationMember {
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: string;
} 