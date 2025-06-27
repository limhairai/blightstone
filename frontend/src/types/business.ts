export interface Business {
  id: string;
  organization_id: string;
  name: string;
  business_id: string | null;
  status: string;
  website_url: string | null;
  landing_page: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}
