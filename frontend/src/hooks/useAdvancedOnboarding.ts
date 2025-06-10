import { useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAppData } from '@/contexts/AppDataContext'
import { supabase } from '@/lib/supabaseClient'
import { 
  getOnboardingState, 
  getOnboardingSteps,
  shouldShowOnboarding,
  shouldShowEmailBanner,
  shouldShowSetupButton,
  getOnboardingProgress,
  getOnboardingStrategy,
  OnboardingState,
  OnboardingStep
} from '@/lib/onboarding-state'
import { MOCK_FINANCIAL_DATA, MOCK_ACCOUNTS } from '@/lib/mock-data'

export interface UseAdvancedOnboardingReturn {
  // State
  onboardingState: OnboardingState
  steps: OnboardingStep[]
  progress: ReturnType<typeof getOnboardingProgress>
  strategy: ReturnType<typeof getOnboardingStrategy>
  
  // Visibility flags
  shouldShowOnboarding: boolean
  shouldShowEmailBanner: boolean
  shouldShowSetupButton: boolean
  
  // Actions
  dismissOnboarding: () => Promise<void>
  markStepCompleted: (stepId: string) => Promise<void>
  resetOnboarding: () => Promise<void>
}

export function useAdvancedOnboarding(): UseAdvancedOnboardingReturn {
  const { user } = useAuth()
  const { currentOrg, organizations } = useAppData()

  // Get current state
  const currentState = useMemo(() => {
    if (!user) return null

    // In a real app, this would come from the database
    // For now, we'll simulate it based on current data
    const realBalance = currentOrg?.balance || MOCK_FINANCIAL_DATA.walletBalance
    const accountsCount = MOCK_ACCOUNTS.length

    // TODO: Replace with actual database calls
    const mockOnboardingData = {
      hasCompletedEmailVerification: !!user.email_confirmed_at,
      hasEverFundedWallet: realBalance > 0, // This should come from DB
      hasEverCreatedBusiness: organizations.length > 0, // This should come from DB
      hasEverCreatedAccount: accountsCount > 0, // This should come from DB
      hasExplicitlyDismissedOnboarding: false, // This should come from DB
      accountCreatedAt: user.created_at || new Date().toISOString()
    }

    return getOnboardingState(
      mockOnboardingData.hasCompletedEmailVerification,
      mockOnboardingData.hasEverFundedWallet,
      mockOnboardingData.hasEverCreatedBusiness,
      mockOnboardingData.hasEverCreatedAccount,
      
      // Current state
      !!user.email_confirmed_at,
      realBalance > 0,
      organizations.length > 0,
      accountsCount > 0,
      
      // User preferences
      mockOnboardingData.hasExplicitlyDismissedOnboarding,
      mockOnboardingData.accountCreatedAt
    )
  }, [user, currentOrg, organizations])

  // Get derived data
  const steps = useMemo(() => 
    currentState ? getOnboardingSteps(currentState) : []
  , [currentState])

  const progress = useMemo(() => 
    currentState ? getOnboardingProgress(currentState) : {
      completedSteps: 0,
      totalSteps: 4,
      percentage: 0,
      isFullyOnboarded: false,
      nextStep: null
    }
  , [currentState])

  const strategy = useMemo(() => 
    currentState ? getOnboardingStrategy(currentState) : 'none'
  , [currentState])

  // Visibility flags
  const showOnboarding = useMemo(() => 
    currentState ? shouldShowOnboarding(currentState) : false
  , [currentState])

  const showEmailBanner = useMemo(() => 
    currentState ? shouldShowEmailBanner(currentState) : false
  , [currentState])

  const showSetupButton = useMemo(() => 
    currentState ? shouldShowSetupButton(currentState) : false
  , [currentState])

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
        'email-verification': 'hasCompletedEmailVerification',
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
            hasCompletedEmailVerification: !!user.email_confirmed_at,
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
    onboardingState: currentState || {} as OnboardingState,
    steps,
    progress,
    strategy,
    shouldShowOnboarding: showOnboarding,
    shouldShowEmailBanner: showEmailBanner,
    shouldShowSetupButton: showSetupButton,
    dismissOnboarding,
    markStepCompleted,
    resetOnboarding
  }
} 