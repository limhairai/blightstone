import { Business } from "./business";

export type AdAccountStatus = 'active' | 'pending' | 'suspended' | 'restricted' | 'inactive' | 'banned' | 'under-review' | 'archived';

export interface AdAccount {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  account_id: string;
  status: AdAccountStatus;
  balance: number;
  spent: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
  business?: { name: string }; // From the join query
  
  // Additional fields from Dolphin API
  balance_cents?: number;
  spend_cents?: number;
  spend_cap_cents?: number; // New field for spend cap
  ad_account_id?: string;
  dolphin_account_id?: string;
  business_manager_name?: string;
  business_manager_id?: string;
  managing_profile?: string;
  currency?: string;
  binding_status?: string;
  bm_id?: string;
  last_sync_at?: string;
  
  // Additional metrics
  timezone?: string;
  businesses?: { name: string };
} 