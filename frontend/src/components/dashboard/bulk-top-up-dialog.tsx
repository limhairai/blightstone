"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Checkbox } from "../ui/checkbox"
import { ScrollArea } from "../ui/scroll-area"
import { useToast } from "../../hooks/use-toast"
import { formatCurrency } from "../../utils/format"
import { Wallet, DollarSign, Check, Loader2 } from "lucide-react"
import type { AppAccount } from "../../contexts/AppDataContext"

interface BulkTopUpDialogProps {
  selectedAccounts: AppAccount[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopUpComplete: () => void
  mainBalance?: number
}

interface Distribution {
  accountId: string
  amount: string
  percentage: string
}

export function BulkTopUpDialog({
  selectedAccounts,
  open,
  onOpenChange,
  onTopUpComplete,
  mainBalance = 45231.89,
}: BulkTopUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [equalDistribution, setEqualDistribution] = useState(true)
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  // Initialize distributions when dialog opens or selected accounts change
  useEffect(() => {
    if (open && selectedAccounts.length > 0) {
      const initialDistributions = selectedAccounts.map((account) => ({
        accountId: account.id.toString(),
        amount: "",
        percentage: "0",
      }))
      setDistributions(initialDistributions)
    }
  }, [open, selectedAccounts])

  // Handle equal distribution
  useEffect(() => {
    if (equalDistribution && distributions.length > 0 && amount) {
      const amountValue = Number.parseFloat(amount) || 0
      const equalAmount = (amountValue / distributions.length).toFixed(2)
      const equalPercentage = ((Number.parseFloat(equalAmount) / amountValue) * 100).toFixed(0)

      setDistributions(
        distributions.map((dist) => ({
          ...dist,
          amount: equalAmount,
          percentage: equalPercentage,
        })),
      )
    }
  }, [equalDistribution, amount, distributions.length])

  const totalDistributed = distributions.reduce((sum, dist) => {
    return sum + (Number.parseFloat(dist.amount) || 0)
  }, 0)

  const remainingAmount = mainBalance - totalDistributed

  const handleAmountChange = (index: number, value: string) => {
    if (equalDistribution) return // Don't allow manual changes in equal distribution mode

    const newDistributions = [...distributions]
    newDistributions[index].amount = value

    // Calculate percentage
    const amountValue = Number.parseFloat(amount) || 0
    const distAmount = Number.parseFloat(value) || 0
    const percentage = amountValue > 0 ? ((distAmount / amountValue) * 100).toFixed(0) : "0"

    newDistributions[index].percentage = percentage
    setDistributions(newDistributions)
  }

  const handlePercentageChange = (index: number, value: string) => {
    if (equalDistribution) return // Don't allow manual changes in equal distribution mode

    const newDistributions = [...distributions]
    newDistributions[index].percentage = value

    // Calculate amount
    const amountValue = Number.parseFloat(amount) || 0
    const percentageValue = Number.parseFloat(value) || 0
    const distAmount = amountValue > 0 ? ((percentageValue / 100) * amountValue).toFixed(2) : "0"

    newDistributions[index].amount = distAmount
    setDistributions(newDistributions)
  }

  const handleTopUp = async () => {
    if (totalDistributed <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      })
      return
    }

    if (totalDistributed > mainBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Total amount exceeds your main account balance",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setShowSuccess(true)
      toast({
        title: "Bulk Top Up Successful!",
        description: `$${formatCurrency(totalDistributed)} has been distributed to ${selectedAccounts.length} accounts`,
      })

      setTimeout(() => {
        setAmount("")
        setDistributions([])
        setShowSuccess(false)
        onTopUpComplete()
      }, 2000)
    } catch (error) {
      toast({
        title: "Bulk Top Up Failed",
        description: "Failed to process bulk top up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAccountById = (id: string) => {
    return selectedAccounts.find((account) => account.id.toString() === id)
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Bulk Top Up Successful!</h3>
            <p className="text-muted-foreground">
              ${formatCurrency(totalDistributed)} has been distributed to {selectedAccounts.length} accounts
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#c4b5fd]" />
            Bulk Top Up - {selectedAccounts.length} Accounts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Source and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="text-foreground">
                From
              </Label>
              <Select defaultValue="main" disabled>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue>Main Wallet (${formatCurrency(mainBalance)})</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Wallet (${formatCurrency(mainBalance)})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-amount" className="text-foreground">
                Total Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="total-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Equal Distribution Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="equal-distribution"
              checked={equalDistribution}
              onCheckedChange={(checked) => setEqualDistribution(!!checked)}
              className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
            />
            <Label htmlFor="equal-distribution" className="text-sm font-normal text-foreground">
              Distribute equally among selected accounts
            </Label>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Quick Amounts</Label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 2500, 5000, 10000].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-border text-foreground hover:bg-accent"
                  disabled={quickAmount > mainBalance}
                >
                  ${quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Distribution List */}
          <div className="space-y-2 flex-1 overflow-hidden">
            <Label className="text-foreground">Distribution</Label>
            <ScrollArea className="h-[200px] border border-border rounded-md">
              <div className="space-y-3 p-3">
                {distributions.map((dist, index) => {
                  const account = getAccountById(dist.accountId)
                  if (!account) return null

                  return (
                    <div key={dist.accountId} className="grid grid-cols-[2fr,1fr,1fr] gap-3 items-center">
                      <div className="space-y-1">
                        <div className="font-medium text-foreground text-sm">{account.name}</div>
                        <div className="text-xs text-muted-foreground">{account.businessId || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">Current: ${formatCurrency(account.balance)}</div>
                      </div>

                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          value={dist.amount}
                          onChange={(e) => handleAmountChange(index, e.target.value)}
                          className="pl-6 bg-background border-border text-foreground text-sm"
                          placeholder="0.00"
                          disabled={equalDistribution}
                        />
                      </div>

                      <div className="relative">
                        <Input
                          type="number"
                          value={dist.percentage}
                          onChange={(e) => handlePercentageChange(index, e.target.value)}
                          className="pr-6 bg-background border-border text-foreground text-sm"
                          placeholder="0"
                          disabled={equalDistribution}
                        />
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground text-xs">
                          %
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground">Transaction Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total to distribute:</span>
                <span className="font-medium text-foreground">${formatCurrency(totalDistributed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining main balance:</span>
                <span className={`font-medium ${remainingAmount < 0 ? "text-red-400" : "text-foreground"}`}>
                  ${formatCurrency(remainingAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accounts affected:</span>
                <span className="font-medium text-foreground">{selectedAccounts.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={isLoading || totalDistributed <= 0 || remainingAmount < 0}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Top Up ${formatCurrency(totalDistributed)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
