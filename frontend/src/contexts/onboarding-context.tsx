"use client"

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useTeam } from './TeamContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface OnboardingContextType {
  currentStep: number;
  steps: OnboardingStep[];
  updateStep: (stepId: string, data: Partial<OnboardingStep>) => Promise<void>;
  completeStep: (stepId: string) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isOnboardingComplete: boolean;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Profile',
    description: 'Add your personal information',
    completed: false,
    required: true,
  },
  {
    id: 'business',
    title: 'Business Details',
    description: 'Tell us about your business',
    completed: false,
    required: true,
  },
  {
    id: 'team',
    title: 'Team Setup',
    description: 'Create or join a team',
    completed: false,
    required: true,
  },
  {
    id: 'ad-accounts',
    title: 'Connect Ad Accounts',
    description: 'Link your advertising accounts',
    completed: false,
    required: true,
  },
  {
    id: 'preferences',
    title: 'Set Preferences',
    description: 'Configure your notification preferences',
    completed: false,
    required: false,
  },
];

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(defaultSteps);

  const updateStep = useCallback(async (stepId: string, data: Partial<OnboardingStep>) => {
    if (!user) return;

    let newStepsState: OnboardingStep[] = [];
    setSteps(prevSteps => {
      newStepsState = prevSteps.map((step) =>
        step.id === stepId ? { ...step, ...data } : step
      );
      return newStepsState;
    });

    const finalStepsForAPI = newStepsState;

    await fetch(`/api/v1/users/${user.id}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steps: finalStepsForAPI,
        currentStep: finalStepsForAPI.findIndex((step) => !step.completed),
      }),
    });
  }, [user, steps]);

  const completeStep = useCallback(async (stepId: string) => {
    await updateStep(stepId, { completed: true });
    setSteps(prevSteps => {
        const updatedSteps = prevSteps.map(s => s.id === stepId ? { ...s, completed: true } : s);
        const nextStepIndex = updatedSteps.findIndex((step) => !step.completed && step.required);
        setCurrentStep(nextStepIndex > -1 ? nextStepIndex : updatedSteps.filter(s => s.required).length);
        return updatedSteps;
    });
  }, [updateStep]);

  useEffect(() => {
    if (currentTeam) {
      const teamStep = steps.find(step => step.id === 'team');
      if (teamStep && !teamStep.completed) {
        completeStep('team');
      }
    }
  }, [currentTeam, steps, completeStep]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    const resetSteps = defaultSteps.map((step) => ({ ...step, completed: false }));
    setSteps(resetSteps);
    setCurrentStep(0);

    await fetch(`/api/v1/users/${user.id}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steps: resetSteps,
        currentStep: 0,
      }),
    });
  }, [user]);

  const isOnboardingComplete = steps.every(step => !step.required || step.completed);

  const value = {
    currentStep,
    steps,
    updateStep,
    completeStep,
    resetOnboarding,
    isOnboardingComplete,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
