"use client"

import { BusinessManagersTable } from "@/components/business-managers/business-managers-table"
import { ApplyForBmDialog } from "@/components/business-managers/apply-for-bm-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useBusinessManagers } from '@/lib/swr-config'
import { useSubscription } from '@/hooks/useSubscription'
import { useMemo, useCallback, useState } from 'react'
import { mutate as globalMutate } from 'swr'

export default function BusinessManagersPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  const { data: bms, error, isLoading, mutate } = useBusinessManagers()
  const { currentPlan, isLoading: isSubscriptionLoading } = useSubscription()
  
  // Transform server data for display
  const businessManagers = useMemo(() => {
    if (!bms || !Array.isArray(bms)) {
      return []
    }
    
    return bms.map((bm: any) => ({
      id: bm.id,
      organization_id: currentOrganizationId || '',
      name: bm.name,
      status: bm.status,
      is_active: bm.is_active, // Add the is_active field
      created_at: bm.created_at,
      ad_account_count: bm.ad_account_count,
      dolphin_business_manager_id: bm.dolphin_business_manager_id,
      binding_id: bm.binding_id,
      asset_id: bm.asset_id,
      is_application: bm.is_application,
      application_id: bm.application_id
    }))
  }, [bms, currentOrganizationId])

  // Simple refresh callback
  const handleRefresh = useCallback(async () => {
    await mutate()
  }, [mutate])

  // Simple success callback
  const handleApplicationSuccess = useCallback(async () => {
    await mutate()
    
    // Also refresh the setup widget's onboarding progress
    // This will trigger a refresh of the setup widget to show BM application completion
    globalMutate('/api/onboarding-progress')
  }, [mutate])

  const activeManagers = businessManagers.filter((bm) => bm.status === "active" && bm.is_active).length
  const activeAccounts = businessManagers.filter((bm) => bm.status === "active" && bm.is_active).reduce((total, bm) => total + (bm.ad_account_count || 0), 0)

  // Get plan limits with fallbacks
  const bmLimit = currentPlan?.maxBusinesses ?? 0
  const adAccountLimit = currentPlan?.maxAdAccounts ?? 0

  // Format limits (-1 means unlimited)
  const formatLimit = (current: number, limit: number) => {
    if (isSubscriptionLoading) return "..." // Show loading state
    if (limit === -1) return current.toString() // Unlimited
    return `${current} / ${limit}`
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics and Add Button */}
      <div className="flex items-center justify-between">
        {/* Left: Metrics */}
        <div className="flex items-start gap-12 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Active Business Managers
            </span>
            <div className="text-foreground font-semibold text-lg">
              {formatLimit(activeManagers, bmLimit)}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">Active Ad Accounts</span>
            <div className="text-foreground font-semibold text-lg">
              {formatLimit(activeAccounts, adAccountLimit)}
            </div>
          </div>
        </div>

        {/* Right: Add Button */}
        <ApplyForBmDialog onSuccess={handleApplicationSuccess}>
          <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </ApplyForBmDialog>
      </div>

      {/* Business Managers Table */}
      <BusinessManagersTable 
        businessManagers={businessManagers} 
        loading={isLoading} 
        onRefresh={handleRefresh}
      />
    </div>
  )
} 