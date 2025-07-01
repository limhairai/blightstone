export interface TopupRequest {
  id: string
  organization_id: string
  requested_by: string
  ad_account_id: string
  ad_account_name: string
  amount_cents: number
  currency: string
  status: TopupRequestStatus
  priority: TopupRequestPriority
  notes?: string
  admin_notes?: string
  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
  // Fee tracking fields
  fee_amount_cents?: number
  total_deducted_cents?: number
  plan_fee_percentage?: number
  metadata?: {
    business_manager_name?: string
    business_manager_id?: string
    [key: string]: any
  }
}

export type TopupRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export type TopupRequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface CreateTopupRequestData {
  ad_account_id: string
  ad_account_name: string
  amount_cents: number
  currency?: string
  priority?: TopupRequestPriority
  notes?: string
}

export interface UpdateTopupRequestData {
  status?: TopupRequestStatus
  priority?: TopupRequestPriority
  notes?: string
  admin_notes?: string
  processed_by?: string
  processed_at?: string
}

export interface TopupRequestWithUser extends TopupRequest {
  requested_by_user?: {
    email: string
    full_name?: string
  }
  processed_by_user?: {
    email: string
    full_name?: string
  }
  organization?: {
    name: string
  }
} 