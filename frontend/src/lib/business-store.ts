// Unified business store - can switch between mock and Supabase
import { mockBusinessStore, type MockBusiness, type MockAdAccount } from './mock-business-store'
import { supabaseBusinessStore, type SupabaseBusiness, type SupabaseAdAccount } from './supabase-business-store'

// Configuration - set to true to use Supabase, false for mock data
const USE_SUPABASE = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

// Unified interfaces that work with both implementations
export interface Business {
  id: string
  name: string
  businessId: string
  status: "active" | "pending" | "suspended" | "inactive"
  landingPage?: string
  website?: string
  businessType?: string
  description?: string
  country?: string
  timezone?: string
  dateCreated: string
  verification: "verified" | "not_verified" | "pending"
  adAccounts: AdAccount[]
}

export interface AdAccount {
  id: string
  name: string
  accountId: string
  status: "active" | "pending" | "paused" | "error"
  balance: number
  spent: number
  spendLimit: number
  platform: "Meta"
  dateCreated: string
  lastActivity: string
  businessId: string
}

// Transform functions to normalize data between mock and Supabase
const transformSupabaseBusiness = (business: SupabaseBusiness): Business => ({
  id: business.id,
  name: business.name,
  businessId: business.business_id,
  status: business.status,
  landingPage: business.landing_page,
  website: business.website,
  businessType: business.business_type,
  description: business.description,
  country: business.country,
  timezone: business.timezone,
  dateCreated: new Date(business.created_at).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }),
  verification: business.verification,
  adAccounts: (business.ad_accounts || []).map(transformSupabaseAdAccount)
})

const transformSupabaseAdAccount = (account: SupabaseAdAccount): AdAccount => ({
  id: account.id,
  name: account.name,
  accountId: account.account_id,
  status: account.status,
  balance: Number(account.balance),
  spent: Number(account.spent),
  spendLimit: Number(account.spend_limit),
  platform: account.platform,
  dateCreated: new Date(account.created_at).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  }),
  lastActivity: account.last_activity,
  businessId: account.business_id
})

const transformMockBusiness = (business: MockBusiness): Business => ({
  id: business.id,
  name: business.name,
  businessId: business.businessId,
  status: business.status,
  landingPage: business.landingPage,
  website: business.website,
  businessType: business.businessType,
  description: business.description,
  country: business.country,
  timezone: business.timezone,
  dateCreated: business.dateCreated,
  verification: business.verification,
  adAccounts: business.adAccounts.map(transformMockAdAccount)
})

const transformMockAdAccount = (account: MockAdAccount): AdAccount => ({
  id: account.id,
  name: account.name,
  accountId: account.accountId,
  status: account.status,
  balance: account.balance,
  spent: account.spent,
  spendLimit: account.spendLimit,
  platform: account.platform,
  dateCreated: account.dateCreated,
  lastActivity: account.lastActivity,
  businessId: account.businessId
})

// Unified business store interface
export const businessStore = {
  // Get all businesses
  getBusinesses: async (): Promise<Business[]> => {
    if (USE_SUPABASE) {
      const businesses = await supabaseBusinessStore.getBusinesses()
      return businesses.map(transformSupabaseBusiness)
    } else {
      const businesses = mockBusinessStore.getBusinesses()
      return businesses.map(transformMockBusiness)
    }
  },

  // Get business by ID
  getBusiness: async (id: string): Promise<Business | null> => {
    if (USE_SUPABASE) {
      const business = await supabaseBusinessStore.getBusiness(id)
      return business ? transformSupabaseBusiness(business) : null
    } else {
      const business = mockBusinessStore.getBusiness(id)
      return business ? transformMockBusiness(business) : null
    }
  },

  // Create new business
  createBusiness: async (data: {
    name: string
    website: string
    timezone: string
    businessType?: string
    description?: string
    country?: string
  }): Promise<Business> => {
    if (USE_SUPABASE) {
      const business = await supabaseBusinessStore.createBusiness(data)
      return transformSupabaseBusiness(business)
    } else {
      const business = mockBusinessStore.createBusiness(data)
      return transformMockBusiness(business)
    }
  },

  // Create new ad account
  createAdAccount: async (data: {
    businessId: string
    name?: string
    spendLimit?: number
  }): Promise<AdAccount> => {
    if (USE_SUPABASE) {
      const account = await supabaseBusinessStore.createAdAccount(data)
      return transformSupabaseAdAccount(account)
    } else {
      const account = mockBusinessStore.createAdAccount(data)
      return transformMockAdAccount(account)
    }
  },

  // Get approved businesses (for ad account creation)
  getApprovedBusinesses: async (): Promise<Business[]> => {
    if (USE_SUPABASE) {
      const businesses = await supabaseBusinessStore.getApprovedBusinesses()
      return businesses.map(transformSupabaseBusiness)
    } else {
      const businesses = mockBusinessStore.getApprovedBusinesses()
      return businesses.map(transformMockBusiness)
    }
  },

  // Get ad accounts for a business
  getAdAccountsForBusiness: async (businessId: string): Promise<AdAccount[]> => {
    if (USE_SUPABASE) {
      const accounts = await supabaseBusinessStore.getAdAccountsForBusiness(businessId)
      return accounts.map(transformSupabaseAdAccount)
    } else {
      const accounts = mockBusinessStore.getAdAccountsForBusiness(businessId)
      return accounts.map(transformMockAdAccount)
    }
  },

  // Update business status (for admin use)
  updateBusinessStatus: async (
    businessId: string, 
    status: Business['status'], 
    verification?: Business['verification']
  ): Promise<void> => {
    if (USE_SUPABASE) {
      await supabaseBusinessStore.updateBusinessStatus(businessId, status, verification)
    } else {
      mockBusinessStore.updateBusinessStatus(businessId, status, verification)
    }
  },

  // Update ad account status
  updateAdAccountStatus: async (accountId: string, status: AdAccount['status']): Promise<void> => {
    if (USE_SUPABASE) {
      await supabaseBusinessStore.updateAdAccountStatus(accountId, status)
    } else {
      mockBusinessStore.updateAdAccountStatus(accountId, status)
    }
  },

  // Add balance to ad account
  addBalance: async (accountId: string, amount: number): Promise<void> => {
    if (USE_SUPABASE) {
      await supabaseBusinessStore.addBalance(accountId, amount)
    } else {
      mockBusinessStore.addBalance(accountId, amount)
    }
  },

  // Seed demo data (Supabase only)
  seedDemoData: async (): Promise<void> => {
    if (USE_SUPABASE) {
      await supabaseBusinessStore.seedDemoData()
    } else {
      console.log('Demo data seeding not needed for mock store')
    }
  },

  // Clear all data (for testing)
  clearAllData: async (): Promise<void> => {
    if (USE_SUPABASE) {
      await supabaseBusinessStore.clearAllData()
    } else {
      mockBusinessStore.reset()
    }
  },

  // Get current store type
  getStoreType: (): 'supabase' | 'mock' => {
    return USE_SUPABASE ? 'supabase' : 'mock'
  }
} 