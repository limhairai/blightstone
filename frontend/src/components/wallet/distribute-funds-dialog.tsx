"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "../ui/scroll-area"
import { Slider } from "../ui/slider"
import { formatCurrency } from "../../lib/mock-data"
import { Shuffle, Info, Percent, DollarSign, Trash2 } from 'lucide-react'
import { useAppData } from "../../contexts/AppDataContext"
import React from "react"

interface DistributeFundsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  walletBalance: number
}

interface AdAccountDistribution {
  id: string
  name: string
  business: string
  currentBalance: number
  amount: number
  percentage: number
}

export function DistributeFundsDialog({ open, onOpenChange, walletBalance }: DistributeFundsDialogProps) {
  const { state, distributeFunds } = useAppData()
  const [isLoading, setIsLoading] = useState(false)
  const [distributionMode, setDistributionMode] = useState<"percentage" | "fixed">("percentage")
  const [totalAmount, setTotalAmount] = useState(walletBalance)

  // Convert ad accounts to distribution format
  const [adAccounts, setAdAccounts] = useState<AdAccountDistribution[]>(() => 
    state.accounts.map((account, index) => ({
      id: account.id.toString(),
      name: account.name,
      business: account.businessId?.toString() || 'Unknown',
      currentBalance: account.balance,
      amount: 0,
      percentage: index < 4 ? [40, 30, 20, 10][index] : 0 // Default percentages for first 4 accounts
    }))
  )

  // Update ad accounts when state changes
  React.useEffect(() => {
    setAdAccounts(
      state.accounts.map((account, index) => ({
        id: account.id.toString(),
        name: account.name,
        business: account.businessId?.toString() || 'Unknown',
        currentBalance: account.balance,
        amount: adAccounts.find(acc => acc.id === account.id.toString())?.amount ?? 0,
        percentage: adAccounts.find(acc => acc.id === account.id.toString())?.percentage ?? (index < 4 ? [40, 30, 20, 10][index] : 0)
      }))
    )
  }, [state.accounts])

  // Update ad account percentage
  const updateAccountPercentage = (id: string, percentage: number) => {
    // Calculate remaining percentage (excluding the current account)
    const currentAccount = adAccounts.find((a) => a.id === id)
    const currentPercentage = currentAccount?.percentage || 0
    const otherAccountsTotal = adAccounts.reduce(
      (sum, a) => (a.id !== id ? sum + a.percentage : sum),
      0
    )

    // Calculate new total
    const newTotal = otherAccountsTotal + percentage

    // If new total exceeds 100%, adjust other accounts proportionally
    if (newTotal > 100) {
      const excess = newTotal - 100
      const adjustmentFactor = excess / otherAccountsTotal

      setAdAccounts(
        adAccounts.map((a) => {
          if (a.id === id) {
            return { ...a, percentage }
          } else {
            return { ...a, percentage: a.percentage * (1 - adjustmentFactor) }
          }
        })
      )
    } else {
      // Otherwise, just update the current account
      setAdAccounts(
        adAccounts.map((a) => (a.id === id ? { ...a, percentage } : a))
      )
    }
  }

  // Update ad account amount
  const updateAccountAmount = (id: string, amount: number) => {
    // Ensure amount doesn't exceed total
    const safeAmount = Math.min(amount, totalAmount)
    
    // Update the account amount and recalculate percentages
    const updatedAccounts = adAccounts.map((a) => 
      a.id === id ? { ...a, amount: safeAmount } : a
    )
    
    // Calculate total allocated
    const totalAllocated = updatedAccounts.reduce((sum, a) => sum + a.amount, 0)
    
    // Update percentages based on amounts
    const finalAccounts = updatedAccounts.map((a) => ({
      ...a,
      percentage: totalAllocated > 0 ? (a.amount / totalAllocated) * 100 : 0
    }))
    
    setAdAccounts(finalAccounts)
  }

  // Calculate total percentage
  const totalPercentage = adAccounts.reduce((sum, a) => sum + a.percentage, 0)
  
  // Calculate total amount
  const totalDistributed = adAccounts.reduce((sum, a) => sum + (distributionMode === "percentage" ? (a.percentage / 100) * totalAmount : a.amount), 0)
  
  // Calculate remaining amount
  const remainingAmount = walletBalance - totalDistributed

  // Handle distribution
  const handleDistribute = async () => {
    if (totalDistributed <= 0) return

    try {
      setIsLoading(true)
      
      // Calculate final distribution amounts
      const distributionData = adAccounts.map((a) => ({
        accountId: parseInt(a.id),
        amount: distributionMode === "percentage" ? (a.percentage / 100) * totalAmount : a.amount
      })).filter(item => item.amount > 0)

      // Use the context method to distribute funds
      await distributeFunds(distributionData)
      
      // Success - close dialog
      onOpenChange(false)
    } catch (error) {
      console.error('Distribution failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card dark:bg-[#0a0a0a] border-border dark:border-[#333333] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-transparent bg-clip-text">
            Distribute Funds
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <p>Distribute funds from your main wallet to ad accounts</p>
          </div>

          {/* Amount to distribute */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to distribute</label>
            <div className="relative">
              <Input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                max={walletBalance}
                className="pl-8 dark:bg-[#111111] border-[#333333]"
              />
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                onClick={() => setTotalAmount(walletBalance)}
              >
                Max
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: ${formatCurrency(walletBalance)}</span>
              <span>Remaining: ${formatCurrency(remainingAmount)}</span>
            </div>
          </div>

          {/* Distribution mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={distributionMode === "percentage" ? "default" : "outline"}
              size="sm"
              className={distributionMode === "percentage" ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium" : ""}
              onClick={() => setDistributionMode("percentage")}
            >
              <Percent className="h-4 w-4 mr-2" />
              Percentage
            </Button>
            <Button
              variant={distributionMode === "fixed" ? "default" : "outline"}
              size="sm"
              className={distributionMode === "fixed" ? "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black font-medium" : ""}
              onClick={() => setDistributionMode("fixed")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Fixed Amount
            </Button>
          </div>

          {/* Ad account distribution list */}
          <ScrollArea className="h-[280px] rounded-md border border-border p-2">
            <div className="space-y-4">
              {adAccounts.map((account) => {
                const calculatedAmount = distributionMode === "percentage" 
                  ? (account.percentage / 100) * totalAmount 
                  : account.amount
                
                return (
                  <div key={account.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium block">{account.name}</span>
                        <span className="text-xs text-muted-foreground">{account.business}</span>
                        <span className="text-xs text-muted-foreground ml-2">• Current: ${formatCurrency(account.currentBalance)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {distributionMode === "percentage" ? (
                          <span className="text-sm font-medium w-16 text-right">
                            {account.percentage.toFixed(1)}%
                          </span>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              value={account.amount}
                              onChange={(e) => updateAccountAmount(account.id, Number(e.target.value))}
                              className="w-24 h-8 text-sm pl-6 dark:bg-[#111111] border-[#333333]"
                            />
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => updateAccountPercentage(account.id, 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {distributionMode === "percentage" && (
                      <Slider
                        value={[account.percentage]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => updateAccountPercentage(account.id, value[0])}
                      />
                    )}
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Amount: ${formatCurrency(calculatedAmount)}</span>
                      {distributionMode === "percentage" && (
                        <span>{account.percentage.toFixed(1)}% of total</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          {/* Summary */}
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total to distribute</span>
              <span className="text-lg font-semibold">${formatCurrency(totalDistributed)}</span>
            </div>
            {distributionMode === "percentage" && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">Total percentage</span>
                <span className="text-sm font-medium">{totalPercentage.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium"
            disabled={totalDistributed <= 0 || isLoading || totalDistributed > walletBalance}
            onClick={handleDistribute}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Processing...</span>
              </div>
            ) : (
              <>
                <Shuffle className="h-4 w-4 mr-2" />
                Distribute ${formatCurrency(totalDistributed)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
