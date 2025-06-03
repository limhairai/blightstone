"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DistributeFundsProps {
  walletBalance: number
  onDistribute: () => void
}

// Mock data for accounts
const mockAccounts = Array.from({ length: 10 }, (_, i) => ({
  id: `AD-${(1000000 + i).toString()}`,
  name: `Ad Account ${i + 1}`,
  balance: `$${(Math.random() * 100).toFixed(2)}`,
  status: i < 7 ? "active" : i < 9 ? "idle" : "disabled",
}))

export function DistributeFunds({ walletBalance, onDistribute }: DistributeFundsProps) {
  const [sourceWallet, setSourceWallet] = useState("main")
  const [amount, setAmount] = useState("")
  const [percentage, setPercentage] = useState("0")
  const [distributions, setDistributions] = useState<{ accountId: string; amount: string; percentage: string }[]>([
    { accountId: "", amount: "", percentage: "0" },
  ])
  const [equalDistribution, setEqualDistribution] = useState(false)
  const [remainingAmount, setRemainingAmount] = useState(walletBalance)

  // Map to store account names by ID for easy lookup
  const accountNamesById = mockAccounts.reduce(
    (acc, account) => {
      acc[account.id] = account.name
      return acc
    },
    {} as Record<string, string>,
  )

  // Filter out accounts that are already selected
  const getAvailableAccounts = (currentAccountId: string) => {
    const selectedAccountIds = distributions
      .map((d) => d.accountId)
      .filter((id) => id !== currentAccountId && id !== "")

    return mockAccounts.filter((account) => !selectedAccountIds.includes(account.id) || account.id === currentAccountId)
  }

  // Update remaining amount when distributions change
  useEffect(() => {
    const totalDistributed = distributions.reduce((sum, dist) => {
      const distAmount = Number.parseFloat(dist.amount) || 0
      return sum + distAmount
    }, 0)

    setRemainingAmount(walletBalance - totalDistributed)
  }, [distributions, walletBalance])

  // Handle equal distribution
  useEffect(() => {
    if (equalDistribution && distributions.length > 0) {
      const amountValue = Number.parseFloat(amount) || 0;
      const numItems = distributions.length; // distributions.length is from the deps via closure
      const equalAmount = (amountValue / numItems).toFixed(2);
      // Ensure amountValue and numItems are not zero for division to avoid NaN
      const equalPercentage = (amountValue > 0 && numItems > 0)
        ? ((Number.parseFloat(equalAmount) / amountValue) * 100).toFixed(0)
        : "0";

      setDistributions(prevDistributions => // Using functional update
        prevDistributions.map((dist) => ({
          ...dist,
          amount: equalAmount,
          percentage: equalPercentage,
        }))
      );
    }
  }, [equalDistribution, amount, distributions.length]); // Dependencies remain the same

  // Handle adding a new distribution
  const addDistribution = () => {
    setDistributions([...distributions, { accountId: "", amount: "", percentage: "0" }])
  }

  // Handle removing a distribution
  const removeDistribution = (index: number) => {
    const newDistributions = [...distributions]
    newDistributions.splice(index, 1)
    setDistributions(newDistributions)
  }

  // Handle changing a distribution account
  const handleAccountChange = (index: number, accountId: string) => {
    const newDistributions = [...distributions]
    newDistributions[index].accountId = accountId
    setDistributions(newDistributions)
  }

  // Handle changing a distribution amount
  const handleAmountChange = (index: number, value: string) => {
    const newDistributions = [...distributions]
    newDistributions[index].amount = value

    // Calculate percentage
    const amountValue = Number.parseFloat(amount) || 0
    const distAmount = Number.parseFloat(value) || 0
    const percentage = amountValue > 0 ? ((distAmount / amountValue) * 100).toFixed(0) : "0"

    newDistributions[index].percentage = percentage
    setDistributions(newDistributions)
  }

  // Handle changing a distribution percentage
  const handlePercentageChange = (index: number, value: string) => {
    const newDistributions = [...distributions]
    newDistributions[index].percentage = value

    // Calculate amount
    const amountValue = Number.parseFloat(amount) || 0
    const percentageValue = Number.parseFloat(value) || 0
    const distAmount = amountValue > 0 ? ((percentageValue / 100) * amountValue).toFixed(2) : "0"

    newDistributions[index].amount = distAmount
    setDistributions(newDistributions)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onDistribute()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Distribute</Label>
          <Select defaultValue="usd" disabled>
            <SelectTrigger
              id="currency"
              className="bg-background dark:bg-[#111111] border-border dark:border-[#333333]"
            >
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source">From</Label>
          <Select value={sourceWallet} onValueChange={setSourceWallet}>
            <SelectTrigger id="source" className="bg-background dark:bg-[#111111] border-border dark:border-[#333333]">
              <SelectValue placeholder="Select source">Main Wallet (${walletBalance.toFixed(2)})</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Wallet (${walletBalance.toFixed(2)})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background dark:bg-[#111111] border-border dark:border-[#333333] pl-8"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          </div>
          <div className="relative w-24">
            <Input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="bg-background dark:bg-[#111111] border-border dark:border-[#333333] pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="equal-distribution"
          checked={equalDistribution}
          onCheckedChange={(checked) => setEqualDistribution(!!checked)}
        />
        <Label htmlFor="equal-distribution" className="text-sm font-normal">
          Distribute equally among selected accounts
        </Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>To</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDistribution}
            className="border-border dark:border-[#333333] bg-background dark:bg-[#111111] hover:bg-muted dark:hover:bg-[#222222]"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Account
          </Button>
        </div>

        <ScrollArea className="h-[240px] pr-4 rounded-md border border-border dark:border-[#333333]">
          <div className="space-y-3 p-3">
            {distributions.map((dist, index) => (
              <div key={index} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center">
                <Select value={dist.accountId} onValueChange={(value) => handleAccountChange(index, value)}>
                  <SelectTrigger className="bg-background dark:bg-[#111111] border-border dark:border-[#333333]">
                    <SelectValue placeholder="Select account">
                      {dist.accountId ? accountNamesById[dist.accountId] || "Select account" : "Select account"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Select account</SelectItem>
                    {getAvailableAccounts(dist.accountId).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.balance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-24">
                  <Input
                    type="number"
                    value={dist.amount}
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    className="bg-background dark:bg-[#111111] border-border dark:border-[#333333] pl-6"
                    placeholder="0.00"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                </div>

                <div className="relative w-20">
                  <Input
                    type="number"
                    value={dist.percentage}
                    onChange={(e) => handlePercentageChange(index, e.target.value)}
                    className="bg-background dark:bg-[#111111] border-border dark:border-[#333333] pr-6"
                    placeholder="0"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                </div>

                {distributions.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDistribution(index)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50 dark:bg-gradient-to-r dark:from-[#111111] dark:to-[#0a0a0a] border border-border dark:border-[#333333]">
        <span className="text-muted-foreground">Remaining:</span>
        <span
          className={
            remainingAmount < 0
              ? "text-red-400 font-medium"
              : "text-[#a0ffb4] dark:text-[#a0ffb4] text-emerald-600 font-medium"
          }
        >
          ${remainingAmount.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black font-medium px-8"
          disabled={remainingAmount < 0 || distributions.some((d) => !d.accountId)}
        >
          Distribute
        </Button>
      </div>
    </form>
  )
}
