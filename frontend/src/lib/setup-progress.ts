// Setup progress tracking utilities

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

export function shouldShowOnboarding(progress: SetupProgress): boolean {
  const { isComplete } = calculateSetupCompletion(progress)
  return !isComplete
}

export function getNextStep(progress: SetupProgress): SetupStep | null {
  const steps = Object.values(progress)
  const nextIncompleteStep = steps.find(step => step.required && !step.completed)
  return nextIncompleteStep || null
} 