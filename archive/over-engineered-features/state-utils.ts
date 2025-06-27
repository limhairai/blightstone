// Consolidated state management utilities

// ============================================================================
// SETUP PROGRESS TRACKING (Simplified version)
// ============================================================================

export interface SetupStep {
  id: string
  name: string
  completed: boolean
  required: boolean
}

export interface SetupProgress {
  emailVerification: SetupStep
  walletFunding: SetupStep
  businessSetup: SetupStep
  adAccountSetup: SetupStep
}

// Advanced onboarding state for persistent tracking
export interface OnboardingPersistence {
  hasEverCompletedEmail: boolean
  hasEverFundedWallet: boolean
  hasEverCreatedBusiness: boolean
  hasEverCreatedAccount: boolean
  hasExplicitlyDismissedOnboarding: boolean
  accountCreatedAt: string
}

export function getSetupProgress(
  emailVerified: boolean,
  hasBalance: boolean,
  hasBusinesses: boolean,
  hasAccounts: boolean
): SetupProgress {
  return {
    emailVerification: {
      id: 'email-verification',
      name: 'Email Verification',
      completed: emailVerified,
      required: true
    },
    walletFunding: {
      id: 'wallet-funding',
      name: 'Wallet Funding',
      completed: hasBalance,
      required: true
    },
    businessSetup: {
      id: 'business-setup',
      name: 'Business Setup',
      completed: hasBusinesses,
      required: true
    },
    adAccountSetup: {
      id: 'ad-account-setup',
      name: 'Ad Account Setup',
      completed: hasAccounts,
      required: true
    }
  }
}

export function calculateSetupCompletion(progress: SetupProgress): {
  completedSteps: number
  totalSteps: number
  percentage: number
  isComplete: boolean
} {
  const steps = Object.values(progress)
  const requiredSteps = steps.filter(step => step.required)
  const completedRequiredSteps = requiredSteps.filter(step => step.completed)
  
  const completedSteps = completedRequiredSteps.length
  const totalSteps = requiredSteps.length
  const percentage = Math.round((completedSteps / totalSteps) * 100)
  const isComplete = completedSteps === totalSteps
  
  return {
    completedSteps,
    totalSteps,
    percentage,
    isComplete
  }
}

// Smart onboarding logic that considers persistent state
export function shouldShowOnboarding(
  progress: SetupProgress, 
  persistence?: OnboardingPersistence
): boolean {
  // If user explicitly dismissed onboarding, never show it again
  if (persistence?.hasExplicitlyDismissedOnboarding) {
    return false
  }

  // If user has ever completed all core steps, don't show onboarding
  // even if their current state has regressed (e.g., spent all money)
  if (persistence) {
    const hasEverCompletedAll = 
      persistence.hasEverCompletedEmail &&
      persistence.hasEverFundedWallet &&
      persistence.hasEverCreatedBusiness &&
      persistence.hasEverCreatedAccount

    if (hasEverCompletedAll) {
      return false
    }
  }

  // For new users or those without persistence data, use current completion
  const completion = calculateSetupCompletion(progress)
  return !completion.isComplete
}

// Simple version for when we don't have persistence data
export function shouldShowOnboardingSimple(progress: SetupProgress): boolean {
  return shouldShowOnboarding(progress)
}

export function getNextStep(progress: SetupProgress): SetupStep | null {
  const steps = Object.values(progress)
  const nextIncompleteStep = steps.find(step => step.required && !step.completed)
  return nextIncompleteStep || null
}

// Helper to check if user is truly new (within threshold days)
export function isNewUser(accountCreatedAt: string, thresholdDays: number = 7): boolean {
  const accountAge = Date.now() - new Date(accountCreatedAt).getTime()
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)
  return daysSinceCreation <= thresholdDays
}

// ============================================================================
// EMPTY STATE UTILITIES
// ============================================================================

export interface EmptyStateConditions {
  noTransactions: boolean
  noAccounts: boolean
  noBalance: boolean
  emailNotVerified: boolean
}

export function checkEmptyState(
  transactionsCount: number,
  accountsCount: number,
  balance: number,
  emailVerified: boolean
): EmptyStateConditions {
  return {
    noTransactions: transactionsCount === 0,
    noAccounts: accountsCount === 0,
    noBalance: balance === 0,
    emailNotVerified: !emailVerified
  }
}

export function shouldShowSetupElements(conditions: EmptyStateConditions): boolean {
  return conditions.noTransactions && conditions.noAccounts && conditions.noBalance
}

export function shouldShowEmailBanner(conditions: EmptyStateConditions): boolean {
  return conditions.emailNotVerified
} 