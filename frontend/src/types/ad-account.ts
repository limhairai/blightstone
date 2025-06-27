import { Business } from "./business";

export type AdAccountStatus = 'active' | 'pending' | 'suspended' | 'banned' | 'under-review' | 'archived';

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
} 