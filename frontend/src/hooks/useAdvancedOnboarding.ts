import useSWR from 'swr'
import { useAuth } from '../contexts/AuthContext'
import { useMemo } from 'react'
import { staticConfig } from '@/lib/swr-config'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

// Simple onboarding data structure
interface OnboardingData {
  progress: {
    hasVerifiedEmail: boolean;
    hasCreatedBusiness: boolean;
    hasFundedWallet: boolean;
    hasCreatedAdAccount: boolean;
  };
  persistence: {
    hasExplicitlyDismissed: boolean;
  };
}

// Simple step definitions
const ONBOARDING_STEPS = [
  { 
    id: 'email-verification', 
    key: 'hasVerifiedEmail', 
    title: 'Verify Your Email', 
    description: 'Check your inbox for a verification link.' 
  },
  { 
    id: 'business-setup', 
    key: 'hasCreatedBusiness', 
    title: 'Create a Business', 
    description: 'Setup your first business profile.' 
  },
  { 
    id: 'wallet-funding', 
    key: 'hasFundedWallet', 
    title: 'Fund Your Wallet', 
    description: 'Add funds to start running ads.' 
  },
  { 
    id: 'ad-account-setup', 
    key: 'hasCreatedAdAccount', 
    title: 'Link an Ad Account', 
    description: 'Connect your first ad account.' 
  },
]

export function useAdvancedOnboarding() {
  const { user } = useAuth()

  const { data, error, isLoading, mutate } = useSWR<OnboardingData>(
    user ? '/api/onboarding-progress' : null,
    fetcher,
    staticConfig // Use static config for onboarding data that doesn't change often
  )

  // Calculate steps with completion status
  const steps = useMemo(() => {
    if (!data?.progress) return ONBOARDING_STEPS.map(step => ({ ...step, isCompleted: false }));
    
    return ONBOARDING_STEPS.map(step => ({
      ...step,
      isCompleted: data.progress[step.key as keyof typeof data.progress] || false
    }));
  }, [data]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedCount = steps.filter(step => step.isCompleted).length;
    return Math.round((completedCount / steps.length) * 100);
  }, [steps]);

  // Simple logic: show if incomplete AND not dismissed
  const shouldShowOnboarding = useMemo(() => {
    if (isLoading || !data) return false;
    if (completionPercentage === 100) return false;
    if (data.persistence?.hasExplicitlyDismissed) return false;
    return true;
  }, [data, isLoading, completionPercentage]);

  // Dismiss onboarding
  const dismissOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' })
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss onboarding');
      }

      mutate();
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
      throw error;
    }
  };

  return {
    // Main data
    progressData: {
      completionPercentage,
      steps,
      isComplete: completionPercentage === 100
    },
    
    // State
    isLoading,
    isError: !!error,
    error,
    
    // Actions
    shouldShowOnboarding,
    dismissOnboarding,
    mutate,
    
    // Legacy support (for existing code)
    setupProgress: data?.progress,
    nextStep: steps.find(step => !step.isCompleted) || null,
  }
}
