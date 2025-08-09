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
import { getPlanPricing } from '@/lib/config/pricing-config'
import { invalidateAssetCache } from '@/lib/cache-invalidation'

export default function BusinessManagersPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  const { data: bms, error, isLoading, mutate } = useBusinessManagers()
  const { currentPlan, isLoading: isSubscriptionLoading } = useSubscription()

  // Helper function to get plan limits from pricing config
  const getPlanLimits = (plan: any) => {
    if (!plan) return { businessManagers: 0, adAccounts: 0 }
    
    const planId = plan.id as 'starter' | 'growth' | 'scale'
    const planLimits = getPlanPricing(planId)
    
    if (!planLimits) {
      // Free plan or unknown plan - use database fallback
      return {
        businessManagers: plan.maxBusinesses,
        adAccounts: plan.maxAdAccounts
      }
    }
    
    // Use pricing config limits
    return {
      businessManagers: planLimits.businessManagers,
      adAccounts: planLimits.adAccounts
    }
  }

  const planLimits = getPlanLimits(currentPlan)
  
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
      domain_count: bm.domain_count,
      domains: bm.domains,
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

  // ⚡ OPTIMIZED: Comprehensive cache invalidation after application success
  const handleApplicationSuccess = useCallback(async () => {
    // Invalidate all asset-related cache immediately
    if (currentOrganizationId) {
      invalidateAssetCache(currentOrganizationId)
    }
    
    // Also refresh local data
    setTimeout(() => {
      mutate()
    }, 500)
  }, [mutate, currentOrganizationId])

  const activeManagers = businessManagers.filter((bm) => bm.status === "active" && bm.is_active).length
  const activeAccounts = businessManagers.filter((bm) => bm.status === "active" && bm.is_active).reduce((total, bm) => total + (bm.ad_account_count || 0), 0)

  // Get plan limits from pricing config
  const bmLimit = planLimits.businessManagers
  const adAccountLimit = planLimits.adAccounts

  // Format limits (-1 means unlimited)
  const formatLimit = (current: number, limit: number) => {
    if (isSubscriptionLoading) return "..." // Show loading state
    if (limit === -1) return current.toString() // Unlimited
    return `${current} / ${limit}`
  }

  // Show loading state while initial data is loading
  if (isLoading && !bms) {
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
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">Active Ad Accounts</span>
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
          {/* Right: Add Button */}
          <div className="h-10 w-20 bg-muted animate-pulse rounded"></div>
        </div>
        {/* Loading table */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    )
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
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border-0">
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