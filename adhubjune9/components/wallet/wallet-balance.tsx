"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddFundsDialog } from "@/components/wallet/add-funds-dialog"
import { ConsolidateDialog } from "@/components/wallet/consolidate-dialog"
import { DistributeDialog } from "@/components/wallet/distribute-dialog"
import { formatCurrency } from "@/utils/format"
import { Plus, ArrowUpDown, ArrowDownUp, TrendingUp, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletBalance() {
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const { toast } = useToast()

  const balance = 5750.0
  const monthlyGrowth = 12.5

  const copyBalance = () => {
    navigator.clipboard.writeText(balance.toString())
    toast({
      title: "Copied!",
      description: "Balance copied to clipboard.",
    })
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Balance</CardTitle>
          <p className="text-sm text-muted-foreground">Your current wallet balance</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balance Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-foreground">${formatCurrency(balance)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyBalance}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{monthlyGrowth}% this month</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Available for ad campaigns and funding</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setAddFundsOpen(true)}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
            <Button
              variant="outline"
              onClick={() => setConsolidateOpen(true)}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Consolidate
            </Button>
            <Button
              variant="outline"
              onClick={() => setDistributeOpen(true)}
              className="border-border text-foreground hover:bg-accent"
            >
              <ArrowDownUp className="h-4 w-4 mr-2" />
              Distribute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFundsDialog open={addFundsOpen} onOpenChange={setAddFundsOpen} />
      <ConsolidateDialog open={consolidateOpen} onOpenChange={setConsolidateOpen} />
      <DistributeDialog open={distributeOpen} onOpenChange={setDistributeOpen} />
    </>
  )
}
