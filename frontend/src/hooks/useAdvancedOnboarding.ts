import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface OnboardingProgress {
  hasCompletedOnboarding: boolean
  completionPercentage: number
  nextStep: string | null
}

export function useAdvancedOnboarding() {
  const { user, session } = useAuth()
  const [progressData, setProgressData] = useState<OnboardingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const checkOnboardingStatus = async () => {
    if (!user || !session) {
      setIsLoading(false)
      return
    }

    try {
      setIsError(false)
      // Get user's organization details to check if onboarding is complete
      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organization data')
      }

      const data = await response.json()
      const organization = data.organizations?.[0]

      if (!organization) {
        // No organization found - this shouldn't happen for registered users
        setProgressData({
          hasCompletedOnboarding: false,
          completionPercentage: 0,
          nextStep: 'organization-setup'
        })
        setIsLoading(false)
        return
      }

      // Check if basic onboarding info is collected
      const hasBasicInfo = !!(
        organization.name &&
        organization.industry &&
        organization.ad_spend_monthly &&
        organization.timezone &&
        organization.how_heard_about_us
      )

      setProgressData({
        hasCompletedOnboarding: hasBasicInfo,
        completionPercentage: hasBasicInfo ? 100 : 0,
        nextStep: hasBasicInfo ? null : 'collect-info'
      })

    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setIsError(true)
      setProgressData({
        hasCompletedOnboarding: false,
        completionPercentage: 0,
        nextStep: 'organization-setup'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkOnboardingStatus()
  }, [user, session])

  const shouldShowOnboarding = progressData && !progressData.hasCompletedOnboarding

  // Mock functions for components expecting them
  const mutate = async () => {
    setIsLoading(true)
    await checkOnboardingStatus()
  }

  const dismissOnboarding = async () => {
    // For now, just mark as completed
    setProgressData({
      hasCompletedOnboarding: true,
      completionPercentage: 100,
      nextStep: null
    })
  }

  return {
    progressData,
    isLoading,
    isError,
    shouldShowOnboarding,
    mutate,
    dismissOnboarding
  }
}
