export interface BusinessManager {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  is_active?: boolean; // Client-controlled activation status
  created_at: string;
  ad_account_count?: number;
  domain_count?: number; // Number of domains associated with this BM
  domains?: string[]; // Array of actual domain URLs
  dolphin_business_manager_id?: string;
  is_application?: boolean;
  application_id?: string; // For applications, this contains the application ID
  asset_id?: string; // For deactivation functionality
}
