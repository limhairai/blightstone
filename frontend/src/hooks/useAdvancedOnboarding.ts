import { useMemo, useCallback, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from "../contexts/AppDataContext"
import { OnboardingService } from '../services/supabase-service'
import { 
  getSetupProgress,
  shouldShowOnboarding,
  calculateSetupCompletion,
  getNextStep,
  OnboardingPersistence,
  SetupProgress
} from '../lib/state-utils'

export interface UseAdvancedOnboardingReturn {
  // State
  setupProgress: SetupProgress
  persistence: OnboardingPersistence | null
  completion: ReturnType<typeof calculateSetupCompletion>
  nextStep: ReturnType<typeof getNextStep>
  
  // Visibility flags
  shouldShowOnboarding: boolean
  
  // Loading states
  loading: boolean
  
  // Actions
  dismissOnboarding: () => Promise<void>
  markStepCompleted: (stepId: string) => Promise<void>
  resetOnboarding: () => Promise<void>
  refreshOnboarding: () => Promise<void>
}

export function useAdvancedOnboarding(): UseAdvancedOnboardingReturn {
  const { user } = useAuth()
  const { state } = useAppData()
  const [persistence, setPersistence] = useState<OnboardingPersistence | null>(null)
  const [loading, setLoading] = useState(false)

  // Get current setup progress
  const setupProgress = useMemo(() => {
    const realBalance = state.currentOrganization?.balance || state.financialData.totalBalance
    const accountsCount = state.accounts.length

    return getSetupProgress(
      !!user?.email_confirmed_at,
      realBalance > 0,
      state.organizations.length > 0,
      accountsCount > 0
    )
  }, [user?.email_confirmed_at, state.currentOrganization?.balance, state.financialData.totalBalance, state.organizations.length, state.accounts.length])

  // Load onboarding persistence data from Supabase
  const loadOnboardingData = useCallback(async () => {
    if (!user?.id || state.dataSource !== 'supabase') {
      // For demo mode, use simulated persistence data
      const realBalance = state.currentOrganization?.balance || state.financialData.totalBalance
      const accountsCount = state.accounts.length

      setPersistence({
        hasEverCompletedEmail: !!user?.email_confirmed_at,
        hasEverFundedWallet: realBalance > 0,
        hasEverCreatedBusiness: state.organizations.length > 0,
        hasEverCreatedAccount: accountsCount > 0,
        hasExplicitlyDismissedOnboarding: false,
        accountCreatedAt: user?.created_at || new Date().toISOString()
      })
      return
    }

    try {
      setLoading(true)
      const onboardingData = await OnboardingService.getOnboardingProgress(user.id)
      
      if (onboardingData?.onboardingState) {
        const state = onboardingData.onboardingState
        setPersistence({
          hasEverCompletedEmail: state.hasEverCompletedEmail || false,
          hasEverFundedWallet: state.hasEverFundedWallet || false,
          hasEverCreatedBusiness: state.hasEverCreatedBusiness || false,
          hasEverCreatedAccount: state.hasEverCreatedAccount || false,
          hasExplicitlyDismissedOnboarding: state.hasExplicitlyDismissedOnboarding || false,
          accountCreatedAt: onboardingData.accountCreatedAt || new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
      // Fallback to current state-based persistence
      const realBalance = state.currentOrganization?.balance || state.financialData.totalBalance
      const accountsCount = state.accounts.length

      setPersistence({
        hasEverCompletedEmail: !!user?.email_confirmed_at,
        hasEverFundedWallet: realBalance > 0,
        hasEverCreatedBusiness: state.organizations.length > 0,
        hasEverCreatedAccount: accountsCount > 0,
        hasExplicitlyDismissedOnboarding: false,
        accountCreatedAt: user?.created_at || new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }, [user, state])

  // Load onboarding data on mount and when dependencies change
  useEffect(() => {
    loadOnboardingData()
  }, [loadOnboardingData])

  // Calculate derived data
  const completion = useMemo(() => 
    calculateSetupCompletion(setupProgress)
  , [setupProgress])

  const nextStep = useMemo(() => 
    getNextStep(setupProgress)
  , [setupProgress])

  const showOnboarding = useMemo(() => 
    shouldShowOnboarding(setupProgress, persistence || undefined)
  , [setupProgress, persistence])

  // Actions
  const dismissOnboarding = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      if (state.dataSource === 'supabase') {
        await OnboardingService.dismissOnboarding(user.id)
      }
      
      // Update local state
      setPersistence(prev => prev ? {
        ...prev,
        hasExplicitlyDismissedOnboarding: true
      } : null)
      
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, state.dataSource])

  const markStepCompleted = useCallback(async (stepId: string) => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Map step IDs to database fields
      const fieldMap: Record<string, string> = {
        'email-verification': 'hasEverCompletedEmail',
        'wallet-funding': 'hasEverFundedWallet',
        'business-setup': 'hasEverCreatedBusiness',
        'ad-account-setup': 'hasEverCreatedAccount'
      }

      const field = fieldMap[stepId]
      if (!field) return

      if (state.dataSource === 'supabase') {
        await OnboardingService.updateOnboardingStep(user.id, field, true)
      }
      
      // Update local state
      setPersistence(prev => prev ? {
        ...prev,
        [field]: true
      } : null)
      
    } catch (error) {
      console.error('Error marking step completed:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, state.dataSource])

  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      if (state.dataSource === 'supabase') {
        await OnboardingService.resetOnboarding(user.id)
      }
      
      // Reset local state
      setPersistence({
        hasEverCompletedEmail: !!user.email_confirmed_at,
        hasEverFundedWallet: false,
        hasEverCreatedBusiness: false,
        hasEverCreatedAccount: false,
        hasExplicitlyDismissedOnboarding: false,
        accountCreatedAt: user.created_at || new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Error resetting onboarding:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.email_confirmed_at, user?.created_at, state.dataSource])

  const refreshOnboarding = useCallback(async () => {
    await loadOnboardingData()
  }, [loadOnboardingData])

  return {
    setupProgress,
    persistence,
    completion,
    nextStep,
    shouldShowOnboarding: showOnboarding,
    loading,
    dismissOnboarding,
    markStepCompleted,
    resetOnboarding,
    refreshOnboarding
  }
} 