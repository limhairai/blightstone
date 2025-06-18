// Supabase business store - real database operations
import { supabase } from './stores/supabase-client'

export interface SupabaseBusiness {
  id: string
  user_id: string
  organization_id: string
  name: string
  business_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  verification: "verified" | "not_verified" | "pending"
  landing_page?: string
  website?: string
  business_type?: string
  description?: string
  country?: string
  timezone?: string
  created_at: string
  updated_at: string
  ad_accounts?: SupabaseAdAccount[]
}

export interface SupabaseAdAccount {
  id: string
  business_id: string
  user_id: string
  name: string
  account_id: string
  status: "active" | "pending" | "paused" | "error"
  balance: number
  spent: number
  spend_limit: number
  platform: "Meta"
  last_activity: string
  created_at: string
  updated_at: string
}

// Helper functions
const generateBusinessId = () => {
  return Math.floor(100000000000000 + Math.random() * 900000000000000).toString()
}

const generateAdAccountId = () => {
  return `act_${Math.floor(100000000 + Math.random() * 900000000)}`
}

// Business operations with Supabase
export const supabaseBusinessStore = {
  // Get all businesses for current user
  getBusinesses: async (): Promise<SupabaseBusiness[]> => {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        ad_accounts (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
      throw error
    }

    return data || []
  },

  // Get business by ID
  getBusiness: async (id: string): Promise<SupabaseBusiness | null> => {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        ad_accounts (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Business not found
      }
      console.error('Error fetching business:', error)
      throw error
    }

    return data
  },

  // Create new business
  createBusiness: async (data: {
    name: string
    website: string
    timezone: string
    businessType?: string
    description?: string
    country?: string
  }): Promise<SupabaseBusiness> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // For demo purposes, we'll use a default organization
    // In production, this would come from the user's actual organization
    const organizationId = 'demo-org-id'

    const businessData = {
      user_id: user.id,
      organization_id: organizationId,
      name: data.name,
      business_id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
      verification: 'pending' as const,
      landing_page: data.website,
      website: data.website,
      business_type: data.businessType || 'other',
      description: data.description || '',
      country: data.country || 'US',
      timezone: data.timezone
    }

    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert(businessData)
      .select()
      .single()

    if (error) {
      console.error('Error creating business:', error)
      throw error
    }

    // Simulate admin approval process (for demo)
    setTimeout(async () => {
      try {
        await supabase
          .from('businesses')
          .update({ 
            status: 'active', 
            verification: 'verified' 
          })
          .eq('id', newBusiness.id)

        console.log(`Business "${newBusiness.name}" has been approved!`)
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('businessApproved', { 
          detail: { businessId: newBusiness.id } 
        }))
      } catch (error) {
        console.error('Error auto-approving business:', error)
      }
    }, 3000)

    return { ...newBusiness, ad_accounts: [] }
  },

  // Create new ad account
  createAdAccount: async (data: {
    businessId: string
    name?: string
    spendLimit?: number
  }): Promise<SupabaseAdAccount> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Verify business exists and is approved
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, status, verification, ad_accounts(*)')
      .eq('id', data.businessId)
      .single()

    if (businessError || !business) {
      throw new Error('Business not found')
    }

    if (business.status !== 'active' || business.verification !== 'verified') {
      throw new Error('Business must be approved and verified to create ad accounts')
    }

    const accountNumber = (business.ad_accounts?.length || 0) + 1
    const accountData = {
      business_id: data.businessId,
      user_id: user.id,
      name: data.name || `Ad Account ${accountNumber}`,
      account_id: generateAdAccountId(),
      status: 'pending' as const,
      balance: 0,
      spent: 0,
      spend_limit: data.spendLimit || 5000,
      platform: 'Meta' as const,
      last_activity: 'Just created'
    }

    const { data: newAccount, error } = await supabase
      .from('ad_accounts')
      .insert(accountData)
      .select()
      .single()

    if (error) {
      console.error('Error creating ad account:', error)
      throw error
    }

    // Simulate approval process (for demo)
    setTimeout(async () => {
      try {
        await supabase
          .from('ad_accounts')
          .update({ 
            status: 'active',
            last_activity: 'Just activated'
          })
          .eq('id', newAccount.id)

        console.log(`Ad Account "${newAccount.name}" has been activated!`)
        
        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('adAccountActivated', { 
          detail: { accountId: newAccount.id, businessId: data.businessId } 
        }))
      } catch (error) {
        console.error('Error auto-activating ad account:', error)
      }
    }, 2000)

    return newAccount
  },

  // Get approved businesses (for ad account creation)
  getApprovedBusinesses: async (): Promise<SupabaseBusiness[]> => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .eq('verification', 'verified')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching approved businesses:', error)
      throw error
    }

    return data || []
  },

  // Get ad accounts for a business
  getAdAccountsForBusiness: async (businessId: string): Promise<SupabaseAdAccount[]> => {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ad accounts:', error)
      throw error
    }

    return data || []
  },

  // Update business status (for admin use)
  updateBusinessStatus: async (
    businessId: string, 
    status: SupabaseBusiness['status'], 
    verification?: SupabaseBusiness['verification']
  ): Promise<void> => {
    const updateData: any = { status }
    if (verification) {
      updateData.verification = verification
    }

    const { error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)

    if (error) {
      console.error('Error updating business status:', error)
      throw error
    }
  },

  // Update ad account status
  updateAdAccountStatus: async (accountId: string, status: SupabaseAdAccount['status']): Promise<void> => {
    const { error } = await supabase
      .from('ad_accounts')
      .update({ 
        status,
        last_activity: 'Status updated'
      })
      .eq('id', accountId)

    if (error) {
      console.error('Error updating ad account status:', error)
      throw error
    }
  },

  // Add balance to ad account
  addBalance: async (accountId: string, amount: number): Promise<void> => {
    // First get current balance
    const { data: account, error: fetchError } = await supabase
      .from('ad_accounts')
      .select('balance')
      .eq('id', accountId)
      .single()

    if (fetchError || !account) {
      throw new Error('Ad account not found')
    }

    const { error } = await supabase
      .from('ad_accounts')
      .update({ 
        balance: account.balance + amount,
        last_activity: `Added $${amount} balance`
      })
      .eq('id', accountId)

    if (error) {
      console.error('Error adding balance:', error)
      throw error
    }
  },

  // Seed demo data for current user
  seedDemoData: async (): Promise<void> => {
    const { error } = await supabase.rpc('seed_demo_data_for_current_user')

    if (error) {
      console.error('Error seeding demo data:', error)
      throw error
    }

    console.log('Demo data seeded successfully!')
  },

  // Clear all data for current user (for testing)
  clearAllData: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Delete ad accounts first (due to foreign key constraints)
    const { error: adAccountsError } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('user_id', user.id)

    if (adAccountsError) {
      console.error('Error clearing ad accounts:', adAccountsError)
      throw adAccountsError
    }

    // Delete businesses
    const { error: businessesError } = await supabase
      .from('businesses')
      .delete()
      .eq('user_id', user.id)

    if (businessesError) {
      console.error('Error clearing businesses:', businessesError)
      throw businessesError
    }

    console.log('All data cleared successfully!')
  }
} 