"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { OrganizationSettings } from "../../../components/settings/organization-settings"
import { layout } from "../../../lib/layout-utils"
import { toast } from 'sonner'
import { useOrganizationStore } from '@/lib/stores/organization-store'

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { currentOrganizationId } = useOrganizationStore()

  // Handle subscription cancellation from URL params (success is handled in OrganizationSettings)
  useEffect(() => {
    if (!searchParams || !currentOrganizationId) return
    
    const subscriptionResult = searchParams.get('subscription')
    if (subscriptionResult === 'cancelled') {
      // Clear subscription URL params by replacing current URL without the params
      router.replace('/dashboard/settings', { scroll: false })
      toast.info('Subscription upgrade was cancelled.')
    }
  }, [searchParams, currentOrganizationId, router])

  return (
    <div className={layout.pageContent}>
      <OrganizationSettings />
    </div>
  )
} 