"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Separator } from "../ui/separator"
import { useToast } from "../../hooks/use-toast"
import { formatCurrency } from "../../lib/utils"
import { APP_FINANCIAL_DATA } from "../../lib/mock-data"
import { type AppAccount } from "../../contexts/AppDataContext"
import { ArrowUpRight, DollarSign, Check, Loader2, AlertTriangle } from "lucide-react"

interface WithdrawBalanceDialogProps {
  account: AppAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mainBalance?: number
}

export function WithdrawBalanceDialog({
  account,
  open,
  onOpenChange,
  mainBalance = APP_FINANCIAL_DATA.walletBalance,
}: WithdrawBalanceDialogProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  if (!account) return null

  const withdrawAmount = Number.parseFloat(amount) || 0
  const newAccountBalance = account.balance - withdrawAmount
  const newMainBalance = mainBalance + withdrawAmount

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      })
      return
    }

    if (withdrawAmount > account.balance) {
      toast({
        title: "Insufficient Funds",
        description: "Amount exceeds the account balance",
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
        title: "Withdrawal Successful!",
        description: `$${formatCurrency(withdrawAmount)} has been withdrawn from ${account.name}`,
      })

      setTimeout(() => {
        setAmount("")
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to process withdrawal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearBalance = async () => {
    if (account.balance <= 0) {
      toast({
        title: "No Balance",
        description: "Account balance is already empty",
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
        title: "Balance Cleared!",
        description: `$${formatCurrency(account.balance)} has been withdrawn from ${account.name}`,
      })

      setTimeout(() => {
        setAmount("")
        setShowSuccess(false)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Clear Balance Failed",
        description: "Failed to clear balance. Please try again.",
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Withdrawal Successful!</h3>
            <p className="text-muted-foreground">
              ${formatCurrency(withdrawAmount || account.balance)} has been withdrawn from {account.name}
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
            <ArrowUpRight className="h-5 w-5 text-blue-500" />
            Withdraw Balance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Info */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Account</label>
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="font-medium text-foreground">{account.name}</div>
              <div className="text-xs text-muted-foreground font-mono">ID: {account.id}</div>
            </div>
          </div>

          {/* Current Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Account Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(account.balance)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">Main Balance</label>
              <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <DollarSign className="h-4 w-4 text-muted-foreground" />${formatCurrency(mainBalance)}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Withdrawal Amount
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
                max={account.balance}
                step="0.01"
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Quick Amounts</label>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.25).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
              >
                25%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.5).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
              >
                50%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((account.balance * 0.75).toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
              >
                75%
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount(account.balance.toFixed(2))}
                className="border-border text-foreground hover:bg-accent"
              >
                All
              </Button>
            </div>
          </div>

          {/* Preview */}
          {withdrawAmount > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Transaction Preview</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdrawal Amount:</span>
                  <span className="font-medium text-foreground">${formatCurrency(withdrawAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Account Balance:</span>
                  <span className="font-medium text-foreground">${formatCurrency(newAccountBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Main Balance:</span>
                  <span className="font-medium text-foreground">${formatCurrency(newMainBalance)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {withdrawAmount > account.balance * 0.8 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800 dark:text-yellow-200">Large Withdrawal</div>
                <div className="text-yellow-700 dark:text-yellow-300">
                  You&apos;re withdrawing a large portion of this account&apos;s balance. Make sure you have enough funds for ongoing campaigns.
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-border" />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleWithdraw}
              disabled={withdrawAmount <= 0 || withdrawAmount > account.balance || isLoading}
              className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Withdraw ${formatCurrency(withdrawAmount)}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearBalance}
              disabled={account.balance <= 0 || isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Clear All
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
