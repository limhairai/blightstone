"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/utils/format"
import { DollarSign, ArrowDownLeft, Wallet, AlertTriangle } from "lucide-react"
import type { MockAccount } from "@/types/account"

interface WithdrawBalanceDialogProps {
  account: MockAccount | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawBalanceDialog({ account, open, onOpenChange }: WithdrawBalanceDialogProps) {
  const [amount, setAmount] = useState("")
  const [destination, setDestination] = useState("main-balance")
  const [isLoading, setIsLoading] = useState(false)

  if (!account) return null

  const handleWithdraw = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    onOpenChange(false)
    setAmount("")
  }

  const maxWithdraw = Math.max(0, account.balance - 50) // Keep minimum $50 in account

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <ArrowDownLeft className="h-5 w-5 text-blue-500" />
            Withdraw Balance
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {account.name} • Available: ${formatCurrency(maxWithdraw)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              A minimum balance of $50 must remain in the account to keep it active.
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="withdraw-amount" className="text-sm font-medium text-foreground">
              Withdrawal Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={maxWithdraw}
                className="pl-10 text-lg font-medium bg-background border-border text-foreground"
              />
            </div>

            {/* Max Withdraw Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAmount(maxWithdraw.toString())}
              className="border-border text-foreground hover:bg-accent"
            >
              Withdraw Maximum (${formatCurrency(maxWithdraw)})
            </Button>
          </div>

          <Separator className="bg-border" />

          {/* Destination */}
          <div className="space-y-3">
            <Label htmlFor="destination" className="text-sm font-medium text-foreground">
              Destination
            </Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="main-balance" className="text-popover-foreground hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Main Balance
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {amount && Number.parseFloat(amount) > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal Amount:</span>
                <span className="font-medium text-foreground">${formatCurrency(Number.parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="text-foreground">${formatCurrency(account.balance)}</span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground">Remaining Balance:</span>
                <span className="text-foreground">${formatCurrency(account.balance - Number.parseFloat(amount))}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                !amount || Number.parseFloat(amount) <= 0 || Number.parseFloat(amount) > maxWithdraw || isLoading
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Processing..." : "Withdraw Funds"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
