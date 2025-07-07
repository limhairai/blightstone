export interface BusinessManager {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  created_at: string;
  ad_account_count?: number;
  dolphin_business_manager_id?: string;
  is_application?: boolean;
}
