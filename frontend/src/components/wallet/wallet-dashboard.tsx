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
import { TopUpWallet } from "./top-up-wallet"
import { WithdrawFunds } from "./withdraw-funds"

export function WalletDashboard() {
  const [showTopUp, setShowTopUp] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)

  // Mock current organization
  const currentOrg = { id: "org-1", name: "Sample Organization" }

  // Handler functions
  const handleTopUp = async (amount: number) => {
    console.log("Top up wallet with:", amount)
    // TODO: Implement actual top-up logic
    setShowTopUp(false)
  }

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

      {/* Dialogs */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Funds</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add money to your wallet to fund ad accounts
            </DialogDescription>
          </DialogHeader>
          <TopUpWallet
            onTopUp={handleTopUp}
            orgId={currentOrg?.id}
          />
        </DialogContent>
      </Dialog>

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