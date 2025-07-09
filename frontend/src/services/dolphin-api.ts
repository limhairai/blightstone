/**
 * Dolphin Cloud API Integration Service
 * 
 * This service connects to the actual Dolphin API to fetch real Facebook
 * Business Managers and Ad Accounts from your Dolphin profiles.
 */

// Types based on Dolphin API responses
export interface DolphinBusinessManager {
  id: string                    // Dolphin internal ID
  business_id: string          // Facebook Business Manager ID  
  name: string
  status: 'ACTIVE' | 'RESTRICTED' | 'SUSPENDED'
  account_id: string           // Which Dolphin profile manages this
  primary_page?: string
  verification_status?: string
  created_time?: string
  
  // Aggregated stats from Dolphin
  spend?: number
  impressions?: number
  link_click?: number
  cpm?: number
  
  // Ad accounts under this BM
  ad_accounts?: DolphinAdAccount[]
}

export interface DolphinAdAccount {
  id: string                   // Dolphin internal ID
  ad_account_id: string       // Facebook Ad Account ID
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED' | 'RESTRICTED'
  account_id: string          // Which Dolphin profile manages this
  business_id?: string        // Parent Business Manager ID
  
  // Financial data
  balance: number
  currency: string
  spend_cap?: number
  
  // Performance metrics
  spend?: number
  impressions?: number
  link_click?: number
  cpm?: number
  
  // Metadata
  created_time?: string
  timezone_name?: string
  
  // Health indicators
  is_archived?: boolean
  account_status?: string
}

export interface DolphinProfile {
  id: string
  name: string
  status: 'active' | 'banned' | 'maintenance'
  business_managers: DolphinBusinessManager[]
  ad_accounts: DolphinAdAccount[]
}

export interface DolphinSyncResult {
  success: boolean
  timestamp: string
  profiles_scanned: number
  business_managers_found: number
  ad_accounts_found: number
  new_assets: number
  errors: string[]
}

class DolphinAPIService {
  private baseUrl: string
  private token: string

  constructor() {
    // These should come from environment variables
    this.baseUrl = process.env.NEXT_PUBLIC_DOLPHIN_BASE_URL || 'https://cloud.dolphin.tech'
    this.token = process.env.NEXT_PUBLIC_DOLPHIN_API_TOKEN || ''
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Dolphin API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all Business Managers from Dolphin
   */
  async getBusinessManagers(params: {
    perPage?: number
    page?: number
    currency?: string
    accountStatus?: string[]
  } = {}): Promise<{ data: DolphinBusinessManager[], total: number }> {
    const queryParams = new URLSearchParams({
      perPage: (params.perPage || 100).toString(),
      page: (params.page || 1).toString(),
      currency: params.currency || 'USD',
      with_trashed: '1',
      ...Object.fromEntries(
        (params.accountStatus || ['ACTIVE', 'NEW']).map(status => ['accountStatus[]', status])
      )
    })

    const response = await this.makeRequest<any>(`/fb-businesses?${queryParams}`)
    
    return {
      data: response.data || [],
      total: response.total || 0
    }
  }

  /**
   * Get all Ad Accounts (CABs) from Dolphin
   */
  async getAdAccounts(params: {
    perPage?: number
    page?: number
    currency?: string
    accountStatus?: string[]
    businessManagerId?: string
  } = {}): Promise<{ data: DolphinAdAccount[], total: number }> {
    const queryParams = new URLSearchParams({
      perPage: (params.perPage || 100).toString(),
      page: (params.page || 1).toString(),
      currency: params.currency || 'USD',
      with_trashed: '1',
      showArchivedAdAccount: '1',
      ...Object.fromEntries(
        (params.accountStatus || ['ACTIVE']).map(status => ['accountStatus[]', status])
      )
    })

    if (params.businessManagerId) {
      queryParams.append('adAccountType', 'businessManager')
    }

    const response = await this.makeRequest<any>(`/fb-cabs?${queryParams}`)
    
    return {
      data: response.data || [],
      total: response.total || 0
    }
  }

  /**
   * Get Business Manager statistics
   */
  async getBusinessManagerStats(params: {
    from_date: string
    to_date: string
    currency?: string
  }): Promise<any> {
    const queryParams = new URLSearchParams({
      from_date: params.from_date,
      to_date: params.to_date,
      currency: params.currency || 'USD',
      'aggregateColumns[]': 'spend',
    })

    return this.makeRequest<any>(`/fb-businesses/total-stats?${queryParams}`)
  }

  /**
   * Get Ad Account statistics
   */
  async getAdAccountStats(params: {
    from_date: string
    to_date: string
    currency?: string
    adAccountIds?: string[]
  }): Promise<any> {
    const queryParams = new URLSearchParams({
      from_date: params.from_date,
      to_date: params.to_date,
      currency: params.currency || 'USD',
      'aggregateColumns[]': 'spend',
    })

    if (params.adAccountIds) {
      params.adAccountIds.forEach(id => {
        queryParams.append('adAccountIds[]', id)
      })
    }

    return this.makeRequest<any>(`/fb-cabs/total-stats?${queryParams}`)
  }

  /**
   * Sync all assets from Dolphin profiles
   * This is the main function for the "Sync with Dolphin" button
   */
  async syncAllAssets(): Promise<DolphinSyncResult> {
    const startTime = new Date().toISOString()
    const errors: string[] = []
    let profilesScanned = 0
    let businessManagersFound = 0
    let adAccountsFound = 0

    try {
      // Get all Business Managers
      const bmResponse = await this.getBusinessManagers({ perPage: 1000 })
      businessManagersFound = bmResponse.data.length
      profilesScanned += 1

      // Get all Ad Accounts  
      const cabResponse = await this.getAdAccounts({ perPage: 1000 })
      adAccountsFound = cabResponse.data.length

      return {
        success: true,
        timestamp: startTime,
        profiles_scanned: profilesScanned,
        business_managers_found: businessManagersFound,
        ad_accounts_found: adAccountsFound,
        new_assets: businessManagersFound + adAccountsFound, // In real implementation, filter for truly new assets
        errors
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error')
      
      return {
        success: false,
        timestamp: startTime,
        profiles_scanned: profilesScanned,
        business_managers_found: businessManagersFound,
        ad_accounts_found: adAccountsFound,
        new_assets: 0,
        errors
      }
    }
  }

  /**
   * Create new Ad Accounts in Business Managers
   */
  async createAdAccounts(data: {
    business_id: string
    name: string
    currency: string
    timezone_id: number
  }[]): Promise<any> {
    return this.makeRequest('/fb-cabs', {
      method: 'POST',
      body: JSON.stringify({ cabs: data })
    })
  }

  /**
   * Move Ad Account to different Business Manager
   */
  async moveAdAccountToBM(data: {
    business_id: string
    ad_account_id: string
  }[]): Promise<any> {
    return this.makeRequest('/fb-businesses/remove_ad_account_from_bm', {
      method: 'POST',
      body: JSON.stringify({ data })
    })
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{ success: boolean, message: string }> {
    try {
      await this.makeRequest('/auth/profile')
      return { success: true, message: 'Successfully connected to Dolphin API' }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to connect to Dolphin API'
      }
    }
  }
}

// Export singleton instance
export const dolphinAPI = new DolphinAPIService()

// Helper functions for our app integration
export const convertDolphinBMToAppBusiness = (bm: DolphinBusinessManager): any => {
  return {
    id: bm.id,
    name: bm.name,
    status: bm.status.toLowerCase(),
    balance: 0, // BMs don't have balance, their ad accounts do
    dateCreated: bm.created_time || new Date().toISOString(),
    
    // Extended properties
    fbBmId: bm.business_id,
    managingProfileId: bm.account_id,
    verification: bm.verification_status as any,
    
    // Metrics
    totalSpend: bm.spend || 0,
    impressions: bm.impressions || 0,
    
    // Our app fields
    accountsCount: bm.ad_accounts?.length || 0,
    businessType: 'Facebook Business',
    industry: 'Digital Marketing'
  }
}

export const convertDolphinCABToAppAccount = (cab: DolphinAdAccount): any => {
  return {
    id: cab.id,
    name: cab.name,
    status: cab.status.toLowerCase(),
    balance: cab.balance || 0,
    dateAdded: cab.created_time || new Date().toISOString(),
    
    // Extended properties
    fbAccountId: cab.ad_account_id,
    businessManagerId: cab.business_id,
    managingProfileId: cab.account_id,
    currency: cab.currency,
    // Convert spend_cap from cents to dollars (Dolphin API returns cents)
    spendLimit: (cab.spend_cap || 0) / 100,
    
    // Metrics
    spend: cab.spend || 0,
    impressions: cab.impressions || 0,
    
    // Our app fields
    platform: 'Meta' as const,
    timezone: cab.timezone_name || 'UTC'
  }
} 