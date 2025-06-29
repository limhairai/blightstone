"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { WalletPortfolioCard } from "./wallet-portfolio-card"
import { WalletFundingPanel } from "./wallet-funding-panel"
import { BusinessBalancesTable } from "./business-balances-table"
import { RecentTransactions } from "./recent-transactions"
import { Download, Plus } from "lucide-react"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog"

import { WithdrawFunds } from "./withdraw-funds"
import { SimpleStripeDialog } from "./simple-stripe-dialog"
import { useSWRConfig } from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { toast } from "sonner"

export function WalletDashboard() {
  const [showTopUp, setShowTopUp] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState(500) // Default amount
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()

  return (
    <div className={layout.pageContent}>
      {/* Header */}
      <div className={layout.flexBetween}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your funds and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-accent"
          >
            <Download className="h-4 w-4 mr-2" />
            {contentTokens.actions.export}
          </Button>
          <Button
            onClick={() => setShowTopUp(true)}
            className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </div>

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

      {/* Recent Transactions */}
      <div className="mt-6">
        <RecentTransactions limit={5} />
      </div>

      {/* Stripe Dialog for Add Funds */}
      <SimpleStripeDialog
        open={showTopUp}
        onOpenChange={setShowTopUp}
        amount={topUpAmount}
        onSuccess={() => {
          setShowTopUp(false)
          toast.success("Payment successful! Your new balance will be reflected shortly.")
          if (currentOrganizationId) {
            mutate(`/api/organizations?id=${currentOrganizationId}`);
          }
        }}
      />

      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Transfer money from your wallet to your bank account
            </DialogDescription>
          </DialogHeader>
          <WithdrawFunds />
        </DialogContent>
      </Dialog>
    </div>
  )
}