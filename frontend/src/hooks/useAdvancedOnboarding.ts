import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { OnboardingProgress, OnboardingProgressData } from '../types/onboarding'
import useSWR from 'swr'

// Global cache to prevent duplicate API calls across components
const onboardingCache = new Map<string, { data: OnboardingProgressData; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds cache (much faster for setup guide)

export function useAdvancedOnboarding() {
  const { user, session } = useAuth()

  // Use SWR for proper caching and deduplication
  const { data: onboardingData, error, mutate, isLoading } = useSWR<OnboardingProgressData>(
    session?.access_token ? '/api/onboarding-progress' : null,
    async (url) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding progress')
      }
      return response.json()
    },
    {
      // FAST LOADING for setup guide
      refreshInterval: 0, // Never auto-refresh
      revalidateOnFocus: false, // Don't revalidate on focus
      revalidateOnReconnect: false, // Don't revalidate on reconnect
      revalidateOnMount: true, // Allow initial load
      dedupingInterval: 5000, // 5 seconds deduplication (much faster)
      revalidateIfStale: true, // Allow revalidation of stale data
      focusThrottleInterval: 10000, // 10 seconds focus throttle
      errorRetryCount: 2, // Allow retries
      errorRetryInterval: 5000, // 5 seconds between retries
    }
  )

  // Transform the API data to match the expected format
  const progressData: OnboardingProgress | null = onboardingData ? {
    hasCompletedOnboarding: Object.values(onboardingData.progress).every(Boolean),
    completionPercentage: Math.round(
      (Object.values(onboardingData.progress).filter(Boolean).length / 
       Object.keys(onboardingData.progress).length) * 100
    ),
    nextStep: Object.values(onboardingData.progress).every(Boolean) ? null : 'setup-incomplete'
  } : null

  const shouldShowOnboarding = progressData && !progressData.hasCompletedOnboarding && !onboardingData?.persistence?.hasExplicitlyDismissed

  const dismissOnboarding = async () => {
    try {
      const response = await fetch('/api/onboarding-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'dismiss' })
      })
      
      if (!response.ok) {
        throw new Error('Failed to dismiss onboarding')
      }
      
      // Update local data to reflect dismissal
      if (onboardingData) {
        mutate({
          ...onboardingData,
          persistence: {
            ...onboardingData.persistence,
            hasExplicitlyDismissed: true
          }
        }, false)
      }
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
      throw error
    }
  }

  return {
    progressData,
    isLoading,
    isError: !!error,
    mutate,
    dismissOnboarding,
    shouldShowOnboarding,
    // Expose raw data for components that need it
    rawData: onboardingData
  }
}
