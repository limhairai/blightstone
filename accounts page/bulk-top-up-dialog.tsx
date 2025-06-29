"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/format"
import { DollarSign, Wallet, CreditCard, Users } from "lucide-react"
import type { MockAccount } from "@/types/account"

interface BulkTopUpDialogProps {
  selectedAccounts: MockAccount[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onTopUpComplete: () => void
}

export function BulkTopUpDialog({ selectedAccounts, open, onOpenChange, onTopUpComplete }: BulkTopUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("main-balance")
  const [isLoading, setIsLoading] = useState(false)

  const handleBulkTopUp = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    onTopUpComplete()
    setAmount("")
  }

  const totalAmount = (Number.parseFloat(amount) || 0) * selectedAccounts.length
  const quickAmounts = [50, 100, 250, 500]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <Users className="h-5 w-5 text-[#c4b5fd]" />
            Bulk Top Up Accounts
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Top up {selectedAccounts.length} selected account{selectedAccounts.length > 1 ? "s" : ""}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Accounts Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Selected Accounts</Label>
            <div className="max-h-32 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              {selectedAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{account.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {account.business}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">${formatCurrency(account.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="bulk-amount" className="text-sm font-medium text-foreground">
              Amount per Account
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bulk-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg font-medium bg-background border-border text-foreground"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-border text-foreground hover:bg-accent"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Funding Source */}
          <div className="space-y-3">
            <Label htmlFor="bulk-source" className="text-sm font-medium text-foreground">
              Funding Source
            </Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="main-balance" className="text-popover-foreground hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Main Balance ($12,450.00)
                  </div>
                </SelectItem>
                <SelectItem value="credit-card" className="text-popover-foreground hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit Card (**** 4242)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {amount && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount per Account:</span>
                <span className="font-medium text-foreground">${formatCurrency(Number.parseFloat(amount) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number of Accounts:</span>
                <span className="text-foreground">{selectedAccounts.length}</span>
              </div>
              <Separator className="bg-border" />
              <div className="flex justify-between text-sm font-medium">
                <span className="text-foreground">Total Amount:</span>
                <span className="text-foreground text-lg">${formatCurrency(totalAmount)}</span>
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
              onClick={handleBulkTopUp}
              disabled={!amount || Number.parseFloat(amount) <= 0 || isLoading}
              className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? "Processing..." : `Top Up ${selectedAccounts.length} Accounts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
