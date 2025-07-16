import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { toast } from 'sonner'
import { useSubscriptionSWR } from '@/lib/swr-config'
import { getPlanPricing } from '@/lib/config/pricing-config'

// Global flag to prevent multiple error toasts
let hasShownSubscriptionError = false

interface Plan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  adSpendFee: number
  maxTeamMembers: number
  maxBusinesses: number
  maxAdAccounts: number
  features: string[]
}

interface Usage {
  teamMembers: number
  businessManagers: number
  adAccounts: number
}

interface BillingHistoryItem {
  id: string
  date: string
  amount: number
  status: string
  description: string
}

interface SubscriptionData {
  currentPlan: Plan | null
  usage: Usage
  subscriptionStatus: string | null
  frozen?: boolean
  message?: string
  canTopup?: boolean
  canRequestAssets?: boolean
}

// NEW: Optimized subscription hook using SWR
export function useSubscription() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([])
  
  // Use the new SWR-based subscription hook for better performance
  const { data: subscriptionData, error, isLoading, mutate } = useSubscriptionSWR(currentOrganizationId)
  
  // Extract data from SWR response
  const currentPlan = subscriptionData?.currentPlan || null
  const usage = subscriptionData?.usage || { teamMembers: 0, businessManagers: 0, adAccounts: 0 }
  const subscriptionStatus = subscriptionData?.subscriptionStatus || null
  
  // Calculate ad spend fee
  const calculateFee = async (amount: number) => {
    if (!currentOrganizationId || !currentPlan) return null
    
    const fee_amount = amount * (currentPlan.adSpendFee / 100)
    return {
      base_amount: amount,
      fee_amount,
      total_amount: amount + fee_amount,
      fee_percentage: currentPlan.adSpendFee
    }
  }

  // Fetch available plans for upgrades
  const fetchAvailablePlans = async () => {
    if (!session?.access_token) return []
    
    try {
      const response = await fetch('/api/subscriptions/plans', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans')
      }
      
      const data = await response.json()
      setAvailablePlans(data.plans || [])
      return data.plans || []
    } catch (error) {
      console.error('Error fetching plans:', error)
      return []
    }
  }

  // Upgrade plan (Stripe checkout integration)
  const upgradePlan = async (newPlanId: string) => {
    if (!currentOrganizationId) return false
    
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          planId: newPlanId,
          organizationId: currentOrganizationId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to upgrade plan')
      }
      
      const data = await response.json()
      
      // Redirect to Stripe checkout if URL provided
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return true
      }
      
      // Otherwise refresh subscription data
      await mutate()
      return true
      
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Failed to upgrade plan')
      return false
    }
  }

  // Check if action is within plan limits using pricing config
  const checkLimit = (limitType: 'teamMembers' | 'businessManagers' | 'adAccounts', currentUsage: number) => {
    if (!currentPlan) return false
    
    // Get plan limits from pricing config (single source of truth)
    const planId = currentPlan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      const limits = {
        teamMembers: currentPlan.maxTeamMembers,
        businessManagers: currentPlan.maxBusinesses,
        adAccounts: currentPlan.maxAdAccounts
      }
      
      const limit = limits[limitType]
      return limit === -1 || currentUsage < limit
    }
    
    // Use pricing config limits
    const limits = {
      teamMembers: -1, // No team limits in new pricing model
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts
    }
    
    const limit = limits[limitType]
    return limit === -1 || currentUsage < limit // -1 means unlimited
  }

  // Get usage percentage for progress bars using pricing config
  const getUsagePercentage = (limitType: 'teamMembers' | 'businessManagers' | 'adAccounts') => {
    if (!currentPlan) return 0
    
    // Get plan limits from pricing config (single source of truth)
    const planId = currentPlan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      const limits = {
        teamMembers: currentPlan.maxTeamMembers,
        businessManagers: currentPlan.maxBusinesses,
        adAccounts: currentPlan.maxAdAccounts
      }
      
      const currentUsage = usage[limitType]
      const limit = limits[limitType]
      
      if (limit === -1) return 0 // Unlimited
      if (limit === 0) return 100 // No allowance
      
      return Math.min((currentUsage / limit) * 100, 100)
    }
    
    // Use pricing config limits
    const limits = {
      teamMembers: -1, // No team limits in new pricing model
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts
    }
    
    const currentUsage = usage[limitType]
    const limit = limits[limitType]
    
    if (limit === -1) return 0 // Unlimited
    if (limit === 0) return 100 // No allowance
    
    return Math.min((currentUsage / limit) * 100, 100)
  }

  return {
    isLoading,
    currentPlan,
    usage,
    availablePlans,
    billingHistory,
    subscriptionData,
    calculateFee,
    fetchAvailablePlans,
    upgradePlan,
    checkLimit,
    getUsagePercentage,
    refresh: mutate, // Use SWR's mutate function for refreshing
    error: error?.message || null,
    subscriptionStatus
  }
}

// LEGACY: Keep the old implementation for backward compatibility during migration
export function useSubscriptionLegacy() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isLoading, setIsLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [usage, setUsage] = useState<Usage>({ teamMembers: 0, businessManagers: 0, adAccounts: 0 })
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([])
  const hasAttemptedFetch = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)

  const fetchSubscriptionData = useCallback(async () => {
    if (!currentOrganizationId || !session?.access_token) return

    try {
      setIsLoading(true)
      setError(null)

      // First get the organization data to get the actual organization_id
      const orgResponse = await fetch(`/api/organizations?id=${currentOrganizationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!orgResponse.ok) {
        throw new Error(`Failed to fetch organization: ${orgResponse.status}`)
      }

      const orgData = await orgResponse.json()
      const organization = orgData.organizations?.[0]
      
      if (!organization) {
        throw new Error('Organization not found')
      }

      // Use the actual organization_id for the subscription API
      const actualOrgId = organization.organization_id

      const response = await fetch(`/api/subscriptions/current?organizationId=${actualOrgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.status}`)
      }

      const data = await response.json()
      
      // Store full subscription data
      setSubscriptionData(data)
      setCurrentPlan(data.currentPlan)
      setUsage(data.usage)
      setSubscriptionStatus(data.subscriptionStatus)
      
      // Reset error flag on success
      hasShownSubscriptionError = false
      
    } catch (err) {
      console.error('Error fetching subscription:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
    } finally {
      setIsLoading(false)
      hasAttemptedFetch.current = true
    }
  }, [currentOrganizationId, session?.access_token])

  useEffect(() => {
    fetchSubscriptionData()
  }, [fetchSubscriptionData])

  // Calculate ad spend fee
  const calculateFee = async (amount: number) => {
    if (!currentOrganizationId || !currentPlan) return null
    
    const fee_amount = amount * (currentPlan.adSpendFee / 100)
    return {
      base_amount: amount,
      fee_amount,
      total_amount: amount + fee_amount,
      fee_percentage: currentPlan.adSpendFee
    }
  }

  // Fetch available plans for upgrades
  const fetchAvailablePlans = async () => {
    if (!session?.access_token) return []
    
    try {
      const response = await fetch('/api/subscriptions/plans', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans')
      }
      
      const data = await response.json()
      setAvailablePlans(data.plans || [])
      return data.plans || []
    } catch (error) {
      console.error('Error fetching plans:', error)
      return []
    }
  }

  // Upgrade plan (Stripe checkout integration)
  const upgradePlan = async (newPlanId: string) => {
    if (!currentOrganizationId) return false
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          planId: newPlanId,
          organizationId: currentOrganizationId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to upgrade plan')
      }
      
      const data = await response.json()
      
      // Redirect to Stripe checkout if URL provided
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return true
      }
      
      // Otherwise refresh subscription data
      await fetchSubscriptionData()
      return true
      
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Failed to upgrade plan')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Check if action is within plan limits using pricing config
  const checkLimit = (limitType: 'teamMembers' | 'businessManagers' | 'adAccounts', currentUsage: number) => {
    if (!currentPlan) return false
    
    // Get plan limits from pricing config (single source of truth)
    const planId = currentPlan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      const limits = {
        teamMembers: currentPlan.maxTeamMembers,
        businessManagers: currentPlan.maxBusinesses,
        adAccounts: currentPlan.maxAdAccounts
      }
      
      const limit = limits[limitType]
      return limit === -1 || currentUsage < limit
    }
    
    // Use pricing config limits
    const limits = {
      teamMembers: -1, // No team limits in new pricing model
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts
    }
    
    const limit = limits[limitType]
    return limit === -1 || currentUsage < limit // -1 means unlimited
  }

  // Get usage percentage for progress bars using pricing config
  const getUsagePercentage = (limitType: 'teamMembers' | 'businessManagers' | 'adAccounts') => {
    if (!currentPlan) return 0
    
    // Get plan limits from pricing config (single source of truth)
    const planId = currentPlan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      const limits = {
        teamMembers: currentPlan.maxTeamMembers,
        businessManagers: currentPlan.maxBusinesses,
        adAccounts: currentPlan.maxAdAccounts
      }
      
      const currentUsage = usage[limitType]
      const limit = limits[limitType]
      
      if (limit === -1) return 0 // Unlimited
      if (limit === 0) return 100 // No allowance
      
      return Math.min((currentUsage / limit) * 100, 100)
    }
    
    // Use pricing config limits
    const limits = {
      teamMembers: -1, // No team limits in new pricing model
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts
    }
    
    const currentUsage = usage[limitType]
    const limit = limits[limitType]
    
    if (limit === -1) return 0 // Unlimited
    if (limit === 0) return 100 // No allowance
    
    return Math.min((currentUsage / limit) * 100, 100)
  }

  return {
    isLoading,
    currentPlan,
    usage,
    availablePlans,
    billingHistory,
    subscriptionData,
    calculateFee,
    fetchAvailablePlans,
    upgradePlan,
    checkLimit,
    getUsagePercentage,
    refresh: fetchSubscriptionData,
    error,
    subscriptionStatus
  }
} 