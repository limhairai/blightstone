import useSWR from 'swr'
import { useAuth } from '../contexts/AuthContext'
import { useMemo } from 'react'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// This defines the structure of the data returned by our new API endpoint
interface OnboardingProgress {
  progress: {
    hasVerifiedEmail: boolean;
    hasCreatedBusiness: boolean;
    hasFundedWallet: boolean;
    hasCreatedAdAccount: boolean;
  };
  persistence: {
    hasExplicitlyDismissed: boolean;
    accountCreatedAt: string;
  };
}

// These steps could be defined in a config file
const ONBOARDING_STEPS = [
  { id: 'email-verification', key: 'hasVerifiedEmail', title: 'Verify Your Email', description: 'Check your inbox for a verification link.' },
  { id: 'business-setup', key: 'hasCreatedBusiness', title: 'Create a Business', description: 'Setup your first business profile.' },
  { id: 'wallet-funding', key: 'hasFundedWallet', title: 'Fund Your Wallet', description: 'Add funds to start running ads.' },
  { id: 'ad-account-setup', key: 'hasCreatedAdAccount', title: 'Link an Ad Account', description: 'Connect your first ad account.' },
]

export function useAdvancedOnboarding() {
  const { user, isLoading: isAuthLoading } = useAuth()

  // We only fetch data if the user is logged in.
  const { data, error, isLoading, mutate } = useSWR<OnboardingProgress>(
    user ? '/api/onboarding-progress' : null,
    fetcher
  )

  const loading = isAuthLoading || isLoading;

  const steps = useMemo(() => {
    if (!data?.progress) return ONBOARDING_STEPS.map(step => ({ ...step, isCompleted: false }));
    
    return ONBOARDING_STEPS.map(step => ({
      ...step,
      isCompleted: data.progress[step.key as keyof typeof data.progress] || false
    }));
  }, [data]);

  const completedSteps = useMemo(() => {
    return steps.filter(step => step.isCompleted);
  }, [steps]);

  const completionPercentage = useMemo(() => {
    if (steps.length === 0) return 0;
    return Math.round((completedSteps.length / steps.length) * 100);
  }, [completedSteps, steps]);

  const isComplete = useMemo(() => {
    return completionPercentage === 100;
  }, [completionPercentage]);

  const nextStep = useMemo(() => {
    return steps.find(step => !step.isCompleted) || null;
  }, [steps]);

  const shouldShowOnboarding = useMemo(() => {
    if (loading || !data) return false;
    // Don't show if all steps are complete
    if (isComplete) return false;
    // Don't show if the user explicitly closed the widget
    if (data.persistence?.hasExplicitlyDismissed) return false;
    
    return true;
  }, [data, loading, isComplete]);

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

      // Refresh the data to reflect the dismissal
      mutate();
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
      throw error;
    }
  };

  const progressData = useMemo(() => ({
    completionPercentage,
    steps,
    isComplete
  }), [completionPercentage, steps, isComplete]);

  return {
    progressData,
    isLoading: loading,
    isError: !!error,
    error,
    setupProgress: data?.progress,
    nextStep,
    shouldShowOnboarding,
    mutate,
    dismissOnboarding
  }
}
