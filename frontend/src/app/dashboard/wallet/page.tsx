"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSWRConfig, mutate } from 'swr'
import { useAuth } from "@/contexts/AuthContext"
import { WalletPortfolioCard } from "../../../components/wallet/wallet-portfolio-card"
import { WalletFundingPanel } from "../../../components/wallet/wallet-funding-panel"
import { TransactionsHistory } from "../../../components/wallet/transactions-history"
import { layout } from "../../../lib/layout-utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { authenticatedFetcher } from "@/lib/swr-config"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function WalletPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate } = useSWRConfig()
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshAllData = async () => {
    if (!currentOrganizationId) return
    
    setIsRefreshing(true)
    try {
      // ⚡ OPTIMIZED: Use SWR's built-in revalidation instead of cache-busting
      await Promise.all([
        // Revalidate organization data
        mutate([`/api/organizations?id=${currentOrganizationId}`, session?.access_token], undefined, { revalidate: true }),
        // Revalidate transactions data
        mutate([`/api/transactions?organizationId=${currentOrganizationId}`, session?.access_token], undefined, { revalidate: true }),
      ])
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
      toast.success("Payment successful! Your wallet balance has been updated.")
      
      // Get the payment amount from sessionStorage (set during checkout)
      const paymentAmount = sessionStorage.getItem('pending_payment_amount')
      if (paymentAmount && currentOrganizationId && session?.access_token) {
        const amount = parseFloat(paymentAmount)
        
        // OPTIMISTIC UPDATE: Immediately update the cache with new balance
        const cacheKey = [`/api/organizations?id=${currentOrganizationId}`, session.access_token]
        mutate(cacheKey, (currentData: any) => {
          if (currentData?.organizations?.[0]) {
            const org = { ...currentData.organizations[0] }
            const amountCents = Math.round(amount * 100)
            
            // Update all balance fields immediately
            org.balance_cents += amountCents
            org.total_balance_cents += amountCents
            org.balance = org.balance_cents / 100
            
            if (org.wallets) {
              org.wallets.balance_cents += amountCents
            }
            
            return { organizations: [org] }
          }
          return currentData
        }, { revalidate: false }) // Don't revalidate immediately, let optimistic update show
        
        // Clear the pending payment amount
        sessionStorage.removeItem('pending_payment_amount')
        
        // Background sync after optimistic update (user already sees the change)
        setTimeout(async () => {
          const { CacheInvalidationScenarios } = await import('@/lib/cache-invalidation')
          await CacheInvalidationScenarios.walletFunding()
          
          refreshAllData()
        }, 1000)
      } else {
        // Fallback: if no payment amount stored, do immediate refresh
        refreshAllData()
      }
      
      router.replace('/dashboard/wallet', { scroll: false })
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled.")
      // Clear any pending payment amount on cancellation
      sessionStorage.removeItem('pending_payment_amount')
      router.replace('/dashboard/wallet', { scroll: false })
    }
  }, [searchParams, router, currentOrganizationId, session])

  useEffect(() => {
    // Cleanup: remove pending payment amount on unmount or if it's been there too long
    const cleanup = () => {
      const pendingAmount = sessionStorage.getItem('pending_payment_amount')
      const pendingTimestamp = sessionStorage.getItem('pending_payment_timestamp')
      
      if (pendingAmount && pendingTimestamp) {
        const elapsed = Date.now() - parseInt(pendingTimestamp)
        // Clear if older than 10 minutes (payment likely failed or abandoned)
        if (elapsed > 10 * 60 * 1000) {
          sessionStorage.removeItem('pending_payment_amount')
          sessionStorage.removeItem('pending_payment_timestamp')
        }
      }
    }
    
    cleanup()
    
    return () => {
      // Don't clear on unmount - user might navigate away and come back
      // The timestamp-based cleanup above handles stale data
    }
  }, [])

  return (
    <div className={layout.pageContent}>
      {/* Portfolio and Funding Panel */}
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

      {/* Transactions History */}
      <TransactionsHistory />
    </div>
  )
} 