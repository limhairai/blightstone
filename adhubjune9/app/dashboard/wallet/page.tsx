"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { WalletPortfolioCard } from "@/components/wallet/wallet-portfolio-card"
import { WalletFundingPanel } from "@/components/wallet/wallet-funding-panel"
import { BusinessBalancesTable } from "@/components/wallet/business-balances-table"

export default function WalletPage() {
  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar pageTitle="Wallet" showEmptyStateElements={false} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              {/* Portfolio Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Portfolio Card */}
                <div className="lg:col-span-2">
                  <WalletPortfolioCard />
                </div>

                {/* Funding Panel */}
                <div className="lg:col-span-1">
                  <WalletFundingPanel />
                </div>
              </div>

              {/* Business Balances Table */}
              <BusinessBalancesTable />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
