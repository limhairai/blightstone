export interface TopupRequest {
  id: string
  organization_id: string
  requested_by: string
  ad_account_id: string
  ad_account_name: string
  amount_cents: number
  currency: string
  status: TopupRequestStatus

  processed_by?: string
  processed_at?: string
  created_at: string
  updated_at: string
  // Fee tracking fields
  fee_amount_cents?: number
  total_deducted_cents?: number
  plan_fee_percentage?: number
  // Balance reset fields
  request_type?: 'topup' | 'balance_reset'
  transfer_destination_type?: 'wallet' | 'ad_account'
  transfer_destination_id?: string
  metadata?: {
    business_manager_name?: string
    business_manager_id?: string
    [key: string]: any
  }
}

export type TopupRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'



export interface CreateTopupRequestData {
  ad_account_id: string
  ad_account_name: string
  amount_cents: number
  currency?: string
  request_type?: 'topup' | 'balance_reset'
  transfer_destination_type?: 'wallet' | 'ad_account'
  transfer_destination_id?: string
}

export interface UpdateTopupRequestData {
  status?: TopupRequestStatus
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