// Consolidated state management utilities

// ============================================================================
// ONBOARDING STATE MANAGEMENT
// ============================================================================

export interface OnboardingState {
  // Permanent completion tracking (never resets)
  hasCompletedEmailVerification: boolean
  hasEverFundedWallet: boolean
  hasEverCreatedBusiness: boolean
  hasEverCreatedAccount: boolean
  
  // User intent and preferences
  hasExplicitlyDismissedOnboarding: boolean
  onboardingDismissedAt?: string
  lastOnboardingInteraction?: string
  
  // Current state (can change)
  currentEmailVerified: boolean
  currentHasBalance: boolean
  currentHasBusinesses: boolean
  currentHasAccounts: boolean
  
  // Metadata
  accountCreatedAt: string
  onboardingVersion: string
}

export interface OnboardingStep {
  id: string
  name: string
  description: string
  hasEverCompleted: boolean  // Permanent
  isCurrentlyComplete: boolean  // Current state
  required: boolean
  canRegress: boolean  // Can this step go backwards?
}

export function getOnboardingState(
  // Permanent completion flags (from user profile/database)
  hasCompletedEmailVerification: boolean,
  hasEverFundedWallet: boolean,
  hasEverCreatedBusiness: boolean,
  hasEverCreatedAccount: boolean,
  
  // Current state
  currentEmailVerified: boolean,
  currentHasBalance: boolean,
  currentHasBusinesses: boolean,
  currentHasAccounts: boolean,
  
  // User preferences
  hasExplicitlyDismissedOnboarding: boolean = false,
  accountCreatedAt: string,
  onboardingDismissedAt?: string
): OnboardingState {
  return {
    // Permanent tracking
    hasCompletedEmailVerification,
    hasEverFundedWallet,
    hasEverCreatedBusiness,
    hasEverCreatedAccount,
    
    // User intent
    hasExplicitlyDismissedOnboarding,
    onboardingDismissedAt,
    
    // Current state
    currentEmailVerified,
    currentHasBalance,
    currentHasBusinesses,
    currentHasAccounts,
    
    // Metadata
    accountCreatedAt,
    onboardingVersion: '1.0'
  }
}

export function getOnboardingSteps(state: OnboardingState): OnboardingStep[] {
  return [
    {
      id: 'email-verification',
      name: 'Email Verification',
      description: 'Verify your email address',
      hasEverCompleted: state.hasCompletedEmailVerification,
      isCurrentlyComplete: state.currentEmailVerified,
      required: true,
      canRegress: false // Email verification is permanent
    },
    {
      id: 'wallet-funding',
      name: 'Wallet Funding',
      description: 'Add funds to your wallet',
      hasEverCompleted: state.hasEverFundedWallet,
      isCurrentlyComplete: state.currentHasBalance,
      required: true,
      canRegress: true // Balance can go to 0
    },
    {
      id: 'business-setup',
      name: 'Business Setup',
      description: 'Create your first business',
      hasEverCompleted: state.hasEverCreatedBusiness,
      isCurrentlyComplete: state.currentHasBusinesses,
      required: true,
      canRegress: true // Can delete all businesses
    },
    {
      id: 'ad-account-setup',
      name: 'Ad Account Setup',
      description: 'Create your first ad account',
      hasEverCompleted: state.hasEverCreatedAccount,
      isCurrentlyComplete: state.currentHasAccounts,
      required: true,
      canRegress: true // Can delete all accounts
    }
  ]
}

export function shouldShowOnboarding(state: OnboardingState): boolean {
  // Never show if explicitly dismissed
  if (state.hasExplicitlyDismissedOnboarding) {
    return false
  }
  
  // Check if user is truly new (hasn't completed core steps)
  const coreStepsCompleted = 
    state.hasCompletedEmailVerification &&
    state.hasEverFundedWallet &&
    state.hasEverCreatedBusiness &&
    state.hasEverCreatedAccount
  
  // Show onboarding if core steps not completed
  if (!coreStepsCompleted) {
    return true
  }
  
  // For experienced users, only show if they explicitly need help
  return false
}

export function getOnboardingProgress(state: OnboardingState): {
  completedSteps: number
  totalSteps: number
  percentage: number
  isFullyOnboarded: boolean
  nextStep: OnboardingStep | null
} {
  const steps = getOnboardingSteps(state)
  const requiredSteps = steps.filter(step => step.required)
  const completedSteps = requiredSteps.filter(step => step.hasEverCompleted).length
  const totalSteps = requiredSteps.length
  const percentage = Math.round((completedSteps / totalSteps) * 100)
  const isFullyOnboarded = completedSteps === totalSteps
  
  // Find next incomplete step
  const nextStep = requiredSteps.find(step => !step.hasEverCompleted) || null
  
  return {
    completedSteps,
    totalSteps,
    percentage,
    isFullyOnboarded,
    nextStep
  }
}

export function isNewUser(accountCreatedAt: string, thresholdDays: number = 7): boolean {
  const accountAge = Date.now() - new Date(accountCreatedAt).getTime()
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24)
  return daysSinceCreation <= thresholdDays
}

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

export function getNextStep(progress: SetupProgress): SetupStep | null {
  const steps = Object.values(progress)
  const nextIncompleteStep = steps.find(step => step.required && !step.completed)
  return nextIncompleteStep || null
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