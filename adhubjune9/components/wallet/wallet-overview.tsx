"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddFundsDialog } from "@/components/wallet/add-funds-dialog"
import { ConsolidateFundsDialog } from "@/components/wallet/consolidate-funds-dialog"
import { DistributeFundsDialog } from "@/components/wallet/distribute-funds-dialog"
import { formatCurrency } from "@/utils/format"
import { Plus, ArrowUpDown, ArrowDownUp, TrendingUp, TrendingDown, Copy, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function WalletOverview() {
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [consolidateOpen, setConsolidateOpen] = useState(false)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const { toast } = useToast()

  const balance = 5750.0
  const monthlyGrowth = 12.5
  const weeklyChange = -3.2
  const availableForDistribution = 3200.0
  const totalAllocated = balance - availableForDistribution

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
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#c4b5fd]" />
            Wallet Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Balance */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground">${formatCurrency(balance)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyBalance}
                className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity hover:bg-accent"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">+{monthlyGrowth}% this month</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-red-400">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-sm font-medium">{weeklyChange}% this week</span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Available to distribute</span>
              <span className="font-medium text-foreground">${formatCurrency(availableForDistribution)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Allocated to accounts</span>
              <span className="font-medium text-foreground">${formatCurrency(totalAllocated)}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] transition-all duration-500"
                style={{ width: `${(totalAllocated / balance) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => setAddFundsOpen(true)}
              className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConsolidateOpen(true)}
                className="border-border text-foreground hover:bg-accent"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                Pull
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDistributeOpen(true)}
                className="border-border text-foreground hover:bg-accent"
              >
                <ArrowDownUp className="h-4 w-4 mr-1" />
                Push
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddFundsDialog open={addFundsOpen} onOpenChange={setAddFundsOpen} />
      <ConsolidateFundsDialog open={consolidateOpen} onOpenChange={setConsolidateOpen} />
      <DistributeFundsDialog open={distributeOpen} onOpenChange={setDistributeOpen} walletBalance={balance} />
    </>
  )
}
