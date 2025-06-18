"use client"

import { WalletPortfolioCard } from "../../../components/wallet/wallet-portfolio-card"
import { WalletFundingPanel } from "../../../components/wallet/wallet-funding-panel"
import { BusinessBalancesTable } from "../../../components/wallet/business-balances-table"
import { layout } from "../../../lib/layout-utils"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic'

export default function WalletPage() {
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