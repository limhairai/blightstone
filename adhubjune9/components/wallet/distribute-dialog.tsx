"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/utils/format"
import { ArrowDownUp, DollarSign, Check, Loader2 } from "lucide-react"
import { MOCK_ACCOUNTS } from "@/data/mock-accounts"

interface DistributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mainBalance?: number
}

interface Distribution {
  accountId: string
  amount: string
}

export function DistributeDialog({ open, onOpenChange, mainBalance = 5750.0 }: DistributeDialogProps) {
  const [totalAmount, setTotalAmount] = useState("")
  const [equalDistribution, setEqualDistribution] = useState(true)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [distributions, setDistributions] = useState<Distribution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  // Initialize distributions when dialog opens or selected accounts change
  useEffect(() => {
    if (open && selectedAccounts.length > 0) {
      const initialDistributions = selectedAccounts.map((accountId) => ({
        accountId,
        amount: "",
      }))
      setDistributions(initialDistributions)
    }
  }, [open, selectedAccounts])

  // Handle equal distribution
  useEffect(() => {
    if (equalDistribution && distributions.length > 0 && totalAmount) {
      const amountValue = Number.parseFloat(totalAmount) || 0
      const equalAmount = (amountValue / distributions.length).toFixed(2)

      setDistributions(
        distributions.map((dist) => ({
          ...dist,
          amount: equalAmount,
        })),
      )
    }
  }, [equalDistribution, totalAmount, distributions.length])

  const totalDistributed = distributions.reduce((sum, dist) => {
    return sum + (Number.parseFloat(dist.amount) || 0)
  }, 0)

  const remainingAmount = mainBalance - totalDistributed

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts((prev) => [...prev, accountId])
    } else {
      setSelectedAccounts((prev) => prev.filter((id) => id !== accountId))
      setDistributions((prev) => prev.filter((dist) => dist.accountId !== accountId))
    }
  }

  const handleAmountChange = (accountId: string, value: string) => {
    if (equalDistribution) return // Don't allow manual changes in equal distribution mode

    setDistributions((prev) => prev.map((dist) => (dist.accountId === accountId ? { ...dist, amount: value } : dist)))
  }

  const handleDistribute = async () => {
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
        description: "Total amount exceeds your main wallet balance",
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
        title: "Distribution Successful!",
        description: `$${formatCurrency(totalDistributed)} has been distributed to ${selectedAccounts.length} accounts`,
      })

      setTimeout(() => {
        setTotalAmount("")
        setSelectedAccounts([])
        setDistributions([])
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Distribution Failed",
        description: "Failed to distribute funds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAccountById = (id: string) => {
    return MOCK_ACCOUNTS.find((account) => account.id.toString() === id)
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Distribution Successful!</h3>
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
            <ArrowDownUp className="h-5 w-5 text-[#c4b5fd]" />
            Distribute Funds
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Distribute funds from your main wallet to ad accounts</p>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden">
          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="total-amount" className="text-foreground">
              Total Amount to Distribute
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="total-amount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">Available balance: ${formatCurrency(mainBalance)}</p>
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

          {/* Account Selection */}
          <div className="space-y-2 flex-1 overflow-hidden">
            <Label className="text-foreground">Select Accounts</Label>
            <ScrollArea className="h-[200px] border border-border rounded-md">
              <div className="space-y-3 p-3">
                {MOCK_ACCOUNTS.map((account) => (
                  <div key={account.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedAccounts.includes(account.id.toString())}
                        onCheckedChange={(checked) => handleSelectAccount(account.id.toString(), checked as boolean)}
                        className="border-border data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                      />
                      <div>
                        <div className="font-medium text-foreground text-sm">{account.name}</div>
                        <div className="text-xs text-muted-foreground">{account.business}</div>
                        <div className="text-xs text-muted-foreground">Current: ${formatCurrency(account.balance)}</div>
                      </div>
                    </div>
                    {selectedAccounts.includes(account.id.toString()) && (
                      <div className="w-24">
                        <Input
                          type="number"
                          value={distributions.find((d) => d.accountId === account.id.toString())?.amount || ""}
                          onChange={(e) => handleAmountChange(account.id.toString(), e.target.value)}
                          className="bg-background border-border text-foreground text-sm"
                          placeholder="0.00"
                          disabled={equalDistribution}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          {selectedAccounts.length > 0 && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground">Distribution Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total to distribute:</span>
                  <span className="font-medium text-foreground">${formatCurrency(totalDistributed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining balance:</span>
                  <span className={`font-medium ${remainingAmount < 0 ? "text-red-400" : "text-foreground"}`}>
                    ${formatCurrency(remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accounts selected:</span>
                  <span className="font-medium text-foreground">{selectedAccounts.length}</span>
                </div>
              </div>
            </div>
          )}

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
              onClick={handleDistribute}
              disabled={isLoading || totalDistributed <= 0 || remainingAmount < 0}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Distributing...
                </>
              ) : (
                <>
                  <ArrowDownUp className="mr-2 h-4 w-4" />
                  Distribute ${formatCurrency(totalDistributed)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
