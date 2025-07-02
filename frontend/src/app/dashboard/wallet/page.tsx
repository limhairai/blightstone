"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSWRConfig } from 'swr'
import { WalletPortfolioCard } from "../../../components/wallet/wallet-portfolio-card"
import { WalletFundingPanel } from "../../../components/wallet/wallet-funding-panel"
import { BusinessBalancesTable } from "../../../components/wallet/business-balances-table"
import { layout } from "../../../lib/layout-utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function WalletPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshAllData = async () => {
    if (!currentOrganizationId) return
    
    setIsRefreshing(true)
    try {
      // Invalidate all API endpoints that display balance/organization data
      await Promise.all([
        mutate(`/api/organizations?id=${currentOrganizationId}`), // Current org (wallet page, topbar)
        mutate('/api/organizations'), // All organizations (general org data)
        mutate('/api/transactions'), // Transaction history
        mutate('/api/business-managers'), // Business managers data
        mutate('/api/ad-accounts'), // Ad accounts data
        mutate(`org-${currentOrganizationId}`), // SWR key used by useCurrentOrganization
      ])
      // Don't show toast for automatic refresh, only for manual refresh
      return true
    } catch (error) {
      console.error('Manual refresh failed:', error)
      toast.error("Failed to refresh data")
      return false
    } finally {
      setIsRefreshing(false)
    }
  }

  const manualRefresh = async () => {
    const success = await refreshAllData()
    if (success) {
      toast.success("Wallet balance updated!")
    }
  }

  useEffect(() => {
    if (!searchParams) return
    
    const paymentStatus = searchParams.get("payment")
    if (paymentStatus === "success") {
      toast.success("Payment successful! Your new balance will be reflected shortly.")
      // Wait a moment for webhook to process, then revalidate ALL relevant caches
      setTimeout(() => {
        refreshAllData()
      }, 2000)
      router.replace('/dashboard/wallet', { scroll: false })
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled.")
      router.replace('/dashboard/wallet', { scroll: false })
    }
  }, [searchParams, router, mutate, currentOrganizationId])

  return (
    <div className={layout.pageContent}>
      {/* Portfolio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 items-stretch">
        {/* Main Portfolio Card */}
        <div className="lg:col-span-2 flex">
          <WalletPortfolioCard onRefresh={manualRefresh} isRefreshing={isRefreshing} />
        </div>

        {/* Funding Panel */}
        <div className="lg:col-span-1 flex">
          <WalletFundingPanel />
        </div>
      </div>

      {/* Business Balances Table */}
      <BusinessBalancesTable />
    </div>
  )
} 