export interface BusinessManager {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  is_active?: boolean; // Client-controlled activation status
  created_at: string;
  ad_account_count?: number;
  dolphin_business_manager_id?: string;
  is_application?: boolean;
  application_id?: string; // For applications, this contains the application ID
  asset_id?: string; // For deactivation functionality
}
