"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/utils/format"
import { Wallet, DollarSign, ArrowRight, Check, Loader2 } from "lucide-react"
import type { MockAccount } from "@/types/account"

interface TopUpDialogProps {
  account: MockAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mainBalance?: number
}

export function TopUpDialog({ account, open, onOpenChange, mainBalance = 45231.89 }: TopUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  if (!account) return null

  const topUpAmount = Number.parseFloat(amount) || 0
  const newBalance = account.balance + topUpAmount
  const remainingMainBalance = mainBalance - topUpAmount

  const handleTopUp = async () => {
    if (topUpAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      })
      return
    }

    if (topUpAmount > mainBalance) {
      toast({
        title: "Insufficient Funds",
        description: "Amount exceeds your main account balance",
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
        title: "Top Up Successful!",
        description: `$${formatCurrency(topUpAmount)} has been added to ${account.name}`,
      })

      setTimeout(() => {
        setAmount("")
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Top Up Failed",
        description: "Failed to process top up. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Top Up Successful!</h3>
            <p className="text-muted-foreground">
              ${formatCurrency(topUpAmount)} has been added to {account.name}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#c4b5fd]" />
            Top Up Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Account</label>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="font-medium text-foreground">{account.name}</div>
              <div className="text-xs text-muted-foreground font-mono">{account.adAccount}</div>
            </div>
          </div>

          {/* Current Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Main Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(mainBalance)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Account Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(account.balance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Top Up Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
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

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Quick Amounts</label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 500, 1000, 2500].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-border text-foreground hover:bg-accent"
                  disabled={quickAmount > mainBalance}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {topUpAmount > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-medium text-foreground">Transaction Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount to transfer:</span>
                    <span className="font-medium text-foreground">${formatCurrency(topUpAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New account balance:</span>
                    <span className="font-medium text-foreground">${formatCurrency(newBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining main balance:</span>
                    <span className="font-medium text-foreground">${formatCurrency(remainingMainBalance)}</span>
                  </div>
                </div>
              </div>
            </>
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
              onClick={handleTopUp}
              disabled={isLoading || topUpAmount <= 0}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-white border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Top Up ${formatCurrency(topUpAmount)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
