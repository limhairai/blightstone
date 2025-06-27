import { createClient } from '@supabase/supabase-js'
import { Business } from '../types/business'
import { AdAccount, AppAccount } from '../types/account'
import { Transaction } from '../types/transaction'
import { Organization, Wallet } from '../types/organization'
import { UserProfile } from '../types/user'

// Get API URL from environment
const getApiUrl = () => {
  // In production/staging, use the environment variable
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.adhub.com'
  }
  // In development, use localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// For backward compatibility, alias the new types
interface AppBusiness extends Business {}
interface AppTransaction extends Transaction {}
interface AppOrganization extends Organization {}
interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

// ============================================================================
// BUSINESS OPERATIONS
// ============================================================================

export const BusinessService = {
  // Get all businesses for an organization
  async getBusinessesByOrganization(organizationId: string): Promise<AppBusiness[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching businesses:', error)
      throw new Error(`Failed to fetch businesses: ${error.message}`)
    }

    return data.map(convertSupabaseBusinessToAppBusiness)
  },

  // Get all businesses (admin only)
  async getAllBusinesses(): Promise<AppBusiness[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all businesses:', error)
      throw new Error(`Failed to fetch all businesses: ${error.message}`)
    }

    return data.map(convertSupabaseBusinessToAppBusiness)
  },

  // Create a new business
  async createBusiness(organizationId: string, businessData: Omit<AppBusiness, 'id' | 'dateCreated'>): Promise<AppBusiness> {
    const { data, error } = await supabase
      .from('businesses')
      .insert({
        organization_id: organizationId,
        name: businessData.name,
        website_url: businessData.website,
        status: businessData.status || 'pending',
        timezone: 'UTC'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating business:', error)
      throw new Error(`Failed to create business: ${error.message}`)
    }

    return convertSupabaseBusinessToAppBusiness(data)
  },

  // Update a business
  async updateBusiness(business: AppBusiness): Promise<AppBusiness> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        name: business.name,
        status: business.status,
        website_url: business.website
      })
      .eq('id', business.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating business:', error)
      throw new Error(`Failed to update business: ${error.message}`)
    }

    return convertSupabaseBusinessToAppBusiness(data)
  },

  // Delete a business
  async deleteBusiness(businessId: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId)

    if (error) {
      console.error('Error deleting business:', error)
      throw new Error(`Failed to delete business: ${error.message}`)
    }
  }
}

// ============================================================================
// ACCOUNT OPERATIONS
// ============================================================================

export const AccountService = {
  // Get accounts for a business
  async getAccountsByBusiness(businessId: string): Promise<AppAccount[]> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching accounts:', error)
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }

    return data.map(convertSupabaseAccountToAppAccount)
  },

  // Get all accounts for an organization
  async getAccountsByOrganization(organizationId: string): Promise<AppAccount[]> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select(`
        *,
        businesses!inner(organization_id)
      `)
      .eq('businesses.organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organization accounts:', error)
      throw new Error(`Failed to fetch organization accounts: ${error.message}`)
    }

    return data.map(convertSupabaseAccountToAppAccount)
  },

  // Get all accounts (admin only)
  async getAllAccounts(): Promise<AppAccount[]> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select(`
        *,
        businesses!inner(name, organization_id),
        businesses.organizations!inner(name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all accounts:', error)
      throw new Error(`Failed to fetch all accounts: ${error.message}`)
    }

    return data.map(convertSupabaseAccountToAppAccount)
  },

  // Create a new account
  async createAccount(businessId: string, accountData: Omit<AppAccount, 'id' | 'dateAdded'>): Promise<AppAccount> {
    const { data: user } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('ad_accounts')
      .insert({
        business_id: businessId,
        user_id: user.user?.id,
        name: accountData.name,
        account_id: accountData.accountId || `acc_${Date.now()}`,
        status: accountData.status || 'pending',
        balance: accountData.balance || 0,
  
  
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating account:', error)
      throw new Error(`Failed to create account: ${error.message}`)
    }

    return convertSupabaseAccountToAppAccount(data)
  },

  // Update an account
  async updateAccount(account: AppAccount): Promise<AppAccount> {
    const { data, error } = await supabase
      .from('ad_accounts')
      .update({
        name: account.name,
        status: account.status,
        balance: account.balance,
  
        spent: account.spent || 0
      })
      .eq('id', account.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating account:', error)
      throw new Error(`Failed to update account: ${error.message}`)
    }

    return convertSupabaseAccountToAppAccount(data)
  },

  // Delete an account
  async deleteAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', accountId)

    if (error) {
      console.error('Error deleting account:', error)
      throw new Error(`Failed to delete account: ${error.message}`)
    }
  }
}

// ============================================================================
// TRANSACTION OPERATIONS
// ============================================================================

export const TransactionService = {
  // Get transactions for an organization
  async getTransactionsByOrganization(organizationId: string): Promise<AppTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent transactions

    if (error) {
      console.error('Error fetching transactions:', error)
      throw new Error(`Failed to fetch transactions: ${error.message}`)
    }

    return data.map(convertSupabaseTransactionToAppTransaction)
  },

  // Get all transactions (admin only)
  async getAllTransactions(): Promise<AppTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        organizations!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(500) // Limit for performance

    if (error) {
      console.error('Error fetching all transactions:', error)
      throw new Error(`Failed to fetch all transactions: ${error.message}`)
    }

    return data.map(convertSupabaseTransactionToAppTransaction)
  },

  // Create a new transaction
  async createTransaction(organizationId: string, walletId: string, transactionData: Omit<AppTransaction, 'id'>): Promise<AppTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        wallet_id: walletId,
        organization_id: organizationId,
        type: transactionData.type,
        amount_cents: Math.round(transactionData.amount * 100), // Convert to cents
        description: transactionData.description,
        status: transactionData.status || 'completed',
        reference: transactionData.reference
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      throw new Error(`Failed to create transaction: ${error.message}`)
    }

    return convertSupabaseTransactionToAppTransaction(data)
  }
}

// ============================================================================
// ORGANIZATION OPERATIONS
// ============================================================================

export const OrganizationService = {
  // Get organizations for a user
  async getOrganizationsByUser(userId: string): Promise<AppOrganization[]> {

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        wallets(balance_cents)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organizations:', error)
      throw new Error(`Failed to fetch organizations: ${error.message}`)
    }


    return data.map(convertSupabaseOrganizationToAppOrganization)
  },

  // Get all organizations (admin only)
  async getAllOrganizations(): Promise<AppOrganization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        wallets(balance_cents),
        profiles!organizations_owner_id_fkey(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all organizations:', error)
      throw new Error(`Failed to fetch all organizations: ${error.message}`)
    }

    return data.map(convertSupabaseOrganizationToAppOrganization)
  },

  // Create a new organization
  async createOrganization(userId: string, organizationData: Omit<AppOrganization, 'id' | 'created_at'>): Promise<AppOrganization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        owner_id: userId,
        name: organizationData.name,
        plan_id: organizationData.plan || 'free'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating organization:', error)
      throw new Error(`Failed to create organization: ${error.message}`)
    }

    // Create wallet for the organization
    await supabase
      .from('wallets')
      .insert({
        organization_id: data.id,
        balance_cents: 0
      })

    return convertSupabaseOrganizationToAppOrganization(data)
  }
}

// ============================================================================
// TEAM MEMBER OPERATIONS
// ============================================================================

export const TeamService = {
  // Get team members for an organization
  async getTeamMembersByOrganization(organizationId: string): Promise<TeamMember[]> {
    // First get organization members
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role, joined_at')
      .eq('organization_id', organizationId)
      .order('joined_at', { ascending: false })

    if (membersError) {
      console.error('Error fetching organization members:', membersError)
      throw new Error(`Failed to fetch organization members: ${membersError.message}`)
    }

    if (!members || members.length === 0) {
      return []
    }

    // Then get profiles for those users
    const userIds = members.map(m => m.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    // Combine the data
    const teamMembers = members.map(member => {
      const profile = profiles?.find(p => p.id === member.user_id)
      return {
        ...member,
        profiles: profile || { id: member.user_id, name: 'Unknown', email: '', avatar_url: null }
      }
    })

    return teamMembers.map(convertSupabaseTeamMemberToTeamMember)
  }
}

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

export const UserService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User profile doesn't exist yet
        return null
      }
      console.error('Error fetching user profile:', error)
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return convertSupabaseProfileToUserProfile(data)
  },

  // Update user profile
  async updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: profileData.name,
        email: profileData.email,
        avatar_url: profileData.avatar
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw new Error(`Failed to update user profile: ${error.message}`)
    }

    return convertSupabaseProfileToUserProfile(data)
  }
}

// ============================================================================
// ONBOARDING OPERATIONS
// ============================================================================

export const OnboardingService = {
  // Get user's onboarding progress
  async getOnboardingProgress(userId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_onboarding_progress', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error fetching onboarding progress:', error)
      throw new Error(`Failed to fetch onboarding progress: ${error.message}`)
    }

    return data
  },

  // Update a specific onboarding step
  async updateOnboardingStep(userId: string, field: string, value: boolean): Promise<void> {
    const { error } = await supabase.rpc('update_user_onboarding_state', {
      p_user_id: userId,
      p_field: field,
      p_value: value
    })

    if (error) {
      console.error('Error updating onboarding step:', error)
      throw new Error(`Failed to update onboarding step: ${error.message}`)
    }
  },

  // Mark onboarding as dismissed
  async dismissOnboarding(userId: string): Promise<void> {
    const { error } = await supabase.rpc('dismiss_onboarding', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error dismissing onboarding:', error)
      throw new Error(`Failed to dismiss onboarding: ${error.message}`)
    }
  },

  // Reset onboarding state
  async resetOnboarding(userId: string): Promise<void> {
    const { error } = await supabase.rpc('reset_onboarding', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error resetting onboarding:', error)
      throw new Error(`Failed to reset onboarding: ${error.message}`)
    }
  },

  // Check if onboarding is complete
  async checkOnboardingCompletion(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_onboarding_completion', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error checking onboarding completion:', error)
      throw new Error(`Failed to check onboarding completion: ${error.message}`)
    }

    return data || false
  },

  // Auto-track onboarding steps based on user actions
  async autoTrackStep(userId: string, stepType: 'email' | 'wallet' | 'business' | 'account'): Promise<void> {
    const fieldMap = {
      email: 'hasEverCompletedEmail',
      wallet: 'hasEverFundedWallet', 
      business: 'hasEverCreatedBusiness',
      account: 'hasEverCreatedAccount'
    }

    const field = fieldMap[stepType]
    if (field) {
      await this.updateOnboardingStep(userId, field, true)
    }
  }
}

// ============================================================================
// DOLPHIN ASSETS OPERATIONS
// ============================================================================

export interface DolphinAsset {
  id: string
  asset_type: 'profile' | 'business_manager' | 'ad_account'
  asset_id: string
  name: string
  status: string
  health_status: string
  parent_business_manager_id?: string
  asset_metadata: any
  discovered_at: string
  last_sync_at?: string
  is_bound: boolean
  binding_info?: {
    organization_name: string
    business_name?: string
    business_id?: string
  }
}

export const DolphinAssetsService = {
  // Get all dolphin assets with binding status
  async getAllAssets(assetType?: string): Promise<DolphinAsset[]> {
    let query = supabase
      .from('dolphin_assets')
      .select(`
        *,
        client_asset_bindings!left(
          id,
          spend_limit_cents,
          fee_percentage,
          bound_at,
          organizations!inner(name),
          businesses(name)
        )
      `)
      .order('discovered_at', { ascending: false })

    if (assetType) {
      query = query.eq('asset_type', assetType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching dolphin assets:', error)
      throw new Error(`Failed to fetch dolphin assets: ${error.message}`)
    }

    return data.map(convertSupabaseDolphinAsset)
  },

  // Sync assets from Dolphin API to our database
  async syncFromDolphinAPI(accessToken: string): Promise<{
    success: boolean
    profiles_found: number
    business_managers_found: number
    ad_accounts_found: number
    errors: string[]
  }> {
    try {
      if (!accessToken) {
        throw new Error('No authentication token provided')
      }

      const apiUrl = getApiUrl()
      const response = await fetch(`${apiUrl}/api/dolphin-assets/sync/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error syncing dolphin assets:', error)
      throw error
    }
  },

  // Get assets for a specific organization (client view)
  async getClientAssets(organizationId: string, assetType?: string): Promise<DolphinAsset[]> {
    let query = supabase
      .from('client_asset_bindings')
      .select(`
        *,
        dolphin_assets!inner(*),
        organizations!inner(name),
        businesses(name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active')

    if (assetType) {
      query = query.eq('dolphin_assets.asset_type', assetType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching client assets:', error)
      throw new Error(`Failed to fetch client assets: ${error.message}`)
    }

    return data.map((binding: any) => ({
      ...convertSupabaseDolphinAsset(binding.dolphin_assets),
      is_bound: true,
      binding_info: {
        organization_name: binding.organizations.name,
        business_name: binding.businesses?.name,
        business_id: binding.businesses?.id,
      }
    }))
  }
}

function convertSupabaseBusinessToAppBusiness(supabaseBusiness: any): AppBusiness {
  return {
    id: supabaseBusiness.id,
    name: supabaseBusiness.name,
    status: supabaseBusiness.status,
    balance: 0, // Will be calculated from accounts
    dateCreated: supabaseBusiness.created_at,
    website: supabaseBusiness.website_url
  }
}

function convertSupabaseAccountToAppAccount(supabaseAccount: any): AppAccount {
  return {
    id: supabaseAccount.id,
    name: supabaseAccount.name,
    status: supabaseAccount.status,
    balance: parseFloat(supabaseAccount.balance) || 0,
    dateAdded: supabaseAccount.created_at,
    businessId: supabaseAccount.business_id,
    accountId: supabaseAccount.account_id,
    
    spent: parseFloat(supabaseAccount.spent) || 0,
    
  }
}

function convertSupabaseTransactionToAppTransaction(supabaseTransaction: any): AppTransaction {
  return {
    id: supabaseTransaction.id,
    type: supabaseTransaction.type,
    amount: supabaseTransaction.amount_cents / 100, // Convert from cents
    date: supabaseTransaction.created_at,
    description: supabaseTransaction.description,
    status: supabaseTransaction.status,
    reference: supabaseTransaction.reference
  }
}

function convertSupabaseOrganizationToAppOrganization(supabaseOrg: any): AppOrganization {
  // Fix: wallets is an object, not an array!
  const balance = supabaseOrg.wallets?.balance_cents / 100 || 0

  
  return {
    id: supabaseOrg.id,
    name: supabaseOrg.name,
    plan: supabaseOrg.plan_id || 'free',
    balance,
    created_at: supabaseOrg.created_at,
    avatar: supabaseOrg.avatar_url
  }
}

function convertSupabaseTeamMemberToTeamMember(supabaseTeamMember: any): TeamMember {
  const profile = supabaseTeamMember.profiles
  
  return {
    id: profile.id,
    name: profile.name || 'Unknown',
    email: profile.email || '',
    role: supabaseTeamMember.role,
    status: 'active', // Default status
    joined: supabaseTeamMember.joined_at,
    avatar: profile.avatar_url,
    signInCount: 0, // Not tracked in current schema
    authentication: 'email', // Default
    permissions: {
      canManageTeam: supabaseTeamMember.role === 'owner' || supabaseTeamMember.role === 'admin',
      canManageBusinesses: supabaseTeamMember.role === 'owner' || supabaseTeamMember.role === 'admin',
      canManageAccounts: supabaseTeamMember.role === 'owner' || supabaseTeamMember.role === 'admin',
      canManageWallet: supabaseTeamMember.role === 'owner',
      canViewAnalytics: true
    }
  }
}

function convertSupabaseProfileToUserProfile(supabaseProfile: any): UserProfile {
  return {
    id: supabaseProfile.id,
    name: supabaseProfile.name || '',
    email: supabaseProfile.email || '',
    avatar: supabaseProfile.avatar_url,
    phone: supabaseProfile.phone,
    timezone: supabaseProfile.timezone || 'America/New_York',
    language: supabaseProfile.language || 'en',
    role: supabaseProfile.role || 'client',
    is_superuser: supabaseProfile.is_superuser || false,
    notifications: {
      email: true,
      push: true,
      sms: false
    }
  }
}

function convertSupabaseDolphinAsset(supabaseAsset: any): DolphinAsset {
  const bindings = supabaseAsset.client_asset_bindings || []
  const activeBinding = bindings.find((b: any) => b.status === 'active')

  return {
    id: supabaseAsset.id,
    asset_type: supabaseAsset.asset_type,
    asset_id: supabaseAsset.asset_id,
    name: supabaseAsset.name,
    status: supabaseAsset.status,
    health_status: supabaseAsset.health_status,
    parent_business_manager_id: supabaseAsset.parent_business_manager_id,
    asset_metadata: supabaseAsset.asset_metadata,
    discovered_at: supabaseAsset.discovered_at,
    last_sync_at: supabaseAsset.last_sync_at,
    is_bound: !!activeBinding,
    binding_info: activeBinding ? {
      organization_name: activeBinding.organizations?.name,
      business_name: activeBinding.businesses?.name,
      business_id: activeBinding.businesses?.id,
    } : undefined
  }
} 