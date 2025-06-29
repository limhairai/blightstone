"use client"

import { useEffect } from "react"
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

  useEffect(() => {
    if (!searchParams) return
    
    const paymentStatus = searchParams.get("payment")
    if (paymentStatus === "success") {
      toast.success("Payment successful! Your new balance will be reflected shortly.")
      // Wait a moment for webhook to process, then revalidate the organizations API cache
      setTimeout(() => {
        if (currentOrganizationId) {
      
          mutate(`/api/organizations?id=${currentOrganizationId}`);
        }
      }, 1000)
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
          <WalletPortfolioCard />
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