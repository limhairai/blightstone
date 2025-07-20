import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { OnboardingProgress, OnboardingProgressData } from '../types/onboarding'
import useSWR from 'swr'

// Global cache to prevent duplicate API calls across components
const onboardingCache = new Map<string, { data: OnboardingProgressData; timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds cache (much faster for setup guide)

export function useAdvancedOnboarding() {
  const { user, session } = useAuth()

  // ⚡ INSTANT LOADING: Use SWR with aggressive caching for instant display
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
      // ⚡ OPTIMIZED for instant loading with prefetched data
      refreshInterval: 0, // Never auto-refresh
      revalidateOnFocus: false, // Don't revalidate on focus
      revalidateOnReconnect: false, // Don't revalidate on reconnect
      revalidateOnMount: false, // 🔥 Don't revalidate on mount - use cache first!
      dedupingInterval: 30000, // 30 seconds - longer deduplication
      revalidateIfStale: false, // 🔥 Don't revalidate stale data - prioritize speed
      fallbackData: undefined, // No fallback to avoid loading states
      keepPreviousData: true, // Keep previous data during updates
      errorRetryCount: 1, // Fewer retries for speed
      errorRetryInterval: 2000, // Faster retry interval
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
