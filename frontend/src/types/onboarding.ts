export interface OnboardingProgress {
  hasCompletedOnboarding: boolean
  completionPercentage: number
  nextStep: string | null
}

export interface OnboardingProgressData {
  progress: {
    hasSetupOrganization: boolean
    hasSelectedPlan: boolean
    hasFundedWallet: boolean
    hasAppliedForBM: boolean
    hasActiveBM: boolean
    hasAddedPixel: boolean
    hasSubmittedTopup: boolean
  }
  persistence: {
    hasExplicitlyDismissed: boolean
    accountCreatedAt: string
  }
} 