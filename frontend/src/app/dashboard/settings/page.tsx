"use client"

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { OrganizationSettings } from "../../../components/settings/organization-settings"
import { layout } from "../../../lib/layout-utils"
import { toast } from 'sonner'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { refreshAfterSubscriptionChange, clearSubscriptionUrlParams } from '@/lib/subscription-utils'

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const { currentOrganizationId } = useOrganizationStore()

  // Handle subscription success/cancellation from URL params - automatic refresh
  useEffect(() => {
    if (!searchParams || !currentOrganizationId) return
    
    const subscriptionResult = searchParams.get('subscription')
    if (subscriptionResult === 'success') {
      toast.success('Subscription updated successfully!')
      // Automatic cache refresh - no user action needed
      refreshAfterSubscriptionChange(currentOrganizationId).then(() => {
        clearSubscriptionUrlParams()
      })
    } else if (subscriptionResult === 'cancelled') {
      toast.info('Subscription upgrade was cancelled.')
      clearSubscriptionUrlParams()
    }
  }, [searchParams, currentOrganizationId])

  return (
    <div className={layout.pageContent}>
      <OrganizationSettings />
    </div>
  )
} 