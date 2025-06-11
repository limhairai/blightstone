import { useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppData } from '../contexts/AppDataContext'
import { supabase } from '../lib/supabaseClient'
import { 
  getSetupProgress,
  shouldShowOnboarding,
  calculateSetupCompletion,
  getNextStep,
  OnboardingPersistence,
  SetupProgress
} from '../lib/state-utils'
import { MOCK_FINANCIAL_DATA, MOCK_ACCOUNTS } from '../lib/mock-data'

export interface UseAdvancedOnboardingReturn {
  // State
  setupProgress: SetupProgress
  persistence: OnboardingPersistence | null
  completion: ReturnType<typeof calculateSetupCompletion>
  nextStep: ReturnType<typeof getNextStep>
  
  // Visibility flags
  shouldShowOnboarding: boolean
  
  // Actions
  dismissOnboarding: () => Promise<void>
  markStepCompleted: (stepId: string) => Promise<void>
  resetOnboarding: () => Promise<void>
}

export function useAdvancedOnboarding(): UseAdvancedOnboardingReturn {
  const { user } = useAuth()
  const { currentOrg, organizations } = useAppData()

  // Get current setup progress
  const setupProgress = useMemo(() => {
    const realBalance = currentOrg?.balance || MOCK_FINANCIAL_DATA.walletBalance
    const accountsCount = MOCK_ACCOUNTS.length

    return getSetupProgress(
      !!user?.email_confirmed_at,
      realBalance > 0,
      organizations.length > 0,
      accountsCount > 0
    )
  }, [user?.email_confirmed_at, currentOrg?.balance, organizations.length])

  // Get persistence data (in real app, this would come from database)
  const persistence = useMemo((): OnboardingPersistence | null => {
    if (!user) return null

    // TODO: Replace with actual database calls
    // For now, simulate based on current data
    const realBalance = currentOrg?.balance || MOCK_FINANCIAL_DATA.walletBalance
    const accountsCount = MOCK_ACCOUNTS.length

    return {
      hasEverCompletedEmail: !!user.email_confirmed_at,
      hasEverFundedWallet: realBalance > 0, // This should come from DB
      hasEverCreatedBusiness: organizations.length > 0, // This should come from DB
      hasEverCreatedAccount: accountsCount > 0, // This should come from DB
      hasExplicitlyDismissedOnboarding: false, // This should come from DB
      accountCreatedAt: user.created_at || new Date().toISOString()
    }
  }, [user, currentOrg?.balance, organizations.length])

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
      // Call database function to dismiss onboarding
      const { error } = await supabase.rpc('dismiss_onboarding', {
        p_user_id: user.id
      })

      if (error) {
        console.error('Failed to dismiss onboarding:', error)
        throw error
      }

      // TODO: Update local state or refetch data
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
    }
  }, [user?.id])

  const markStepCompleted = useCallback(async (stepId: string) => {
    if (!user?.id) return

    try {
      // Map step IDs to database fields
      const fieldMap: Record<string, string> = {
        'email-verification': 'hasEverCompletedEmail',
        'wallet-funding': 'hasEverFundedWallet',
        'business-setup': 'hasEverCreatedBusiness',
        'ad-account-setup': 'hasEverCreatedAccount'
      }

      const field = fieldMap[stepId]
      if (!field) return

      // Call database function to update onboarding state
      const { error } = await supabase.rpc('update_user_onboarding_state', {
        p_user_id: user.id,
        p_field: field,
        p_value: true
      })

      if (error) {
        console.error('Failed to mark step completed:', error)
        throw error
      }

      // TODO: Update local state or refetch data
    } catch (error) {
      console.error('Error marking step completed:', error)
    }
  }, [user?.id])

  const resetOnboarding = useCallback(async () => {
    if (!user?.id) return

    try {
      // Reset onboarding state in database
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_state: {
            hasEverCompletedEmail: !!user.email_confirmed_at,
            hasEverFundedWallet: false,
            hasEverCreatedBusiness: false,
            hasEverCreatedAccount: false,
            hasExplicitlyDismissedOnboarding: false,
            onboardingVersion: '1.0'
          }
        })
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to reset onboarding:', error)
        throw error
      }

      // TODO: Update local state or refetch data
    } catch (error) {
      console.error('Error resetting onboarding:', error)
    }
  }, [user?.id, user?.email_confirmed_at])

  return {
    setupProgress,
    persistence,
    completion,
    nextStep,
    shouldShowOnboarding: showOnboarding,
    dismissOnboarding,
    markStepCompleted,
    resetOnboarding
  }
} 