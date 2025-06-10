"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, AlertCircle, Wallet, CreditCard, Building2 } from "lucide-react"
import { contentTokens } from "@/lib/content-tokens"
import { layout } from "@/lib/layout-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, APP_CONSTANTS } from "@/lib/mock-data"

interface TopUpDialogPropsInternal {
  isOpen: boolean
  onClose: () => void
  accountId: string
  accountName: string
  onTopUp?: (amount: number) => void
  walletBalance: number
}

// Renamed to avoid conflict with the wrapper export
function TopUpDialogInternal({
  isOpen,
  onClose,
  accountId,
  accountName,
  onTopUp,
  walletBalance,
}: TopUpDialogPropsInternal) {
  // Use centralized commission rates
  const customerTier = "BASIC"
  const commissionRate = APP_CONSTANTS.COMMISSION_RATES[customerTier]

  const [amount, setAmount] = useState<number>(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("card")

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAmount(100)
      setError(null)
    }
  }, [isOpen])

  const handleAmountChange = (value: number) => {
    setAmount(value)

    // Check if amount exceeds wallet balance
    if (value > walletBalance) {
      setError("Amount exceeds available wallet balance")
    } else {
      setError(null)
    }
  }

  // Use centralized quick amounts
  const quickAmounts = APP_CONSTANTS.QUICK_TOP_UP_AMOUNTS

  const commissionAmount = amount * commissionRate
  const finalAmount = amount - commissionAmount

  const handleSubmit = async () => {
    if (amount <= 0 || amount > walletBalance) return

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (onTopUp) {
      onTopUp(amount)
    }

    setIsSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0a14] border-[#2C2C2E] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-transparent bg-clip-text">
            Top Up Ad Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="space-y-1">
            <Label className="text-[#888888]">Account</Label>
            <div className="font-medium">{accountName}</div>
            <div className="text-xs text-[#6C6C6C]">ID: {accountId}</div>
          </div>

          <div className="flex justify-between items-center p-3 rounded-md bg-[#0a0812] border border-[#2C2C2E]">
            <div>
              <Label className="text-[#888888]">Available Balance</Label>
              <div className="text-lg font-semibold">${walletBalance.toFixed(2)}</div>
            </div>
            <Wallet className="h-5 w-5 text-[#888888]" />
          </div>

          <div className={layout.stackMedium}>
            <div className={layout.formFields}>
              <Label htmlFor="amount" className="text-foreground">
                {contentTokens.labels.amount}
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className={layout.stackMedium}>
              <Label className="text-foreground">Quick amounts</Label>
            <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                <Button
                    key={quickAmount}
                  type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(quickAmount)}
                    className="border-border text-foreground hover:bg-accent"
                >
                    ${quickAmount}
                </Button>
              ))}
              </div>
            </div>

            <div className={layout.formFields}>
              <Label htmlFor="payment-method" className="text-foreground">
                Payment method
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder={contentTokens.placeholders.selectOption} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="card" className="text-popover-foreground hover:bg-accent">
                    Credit/Debit Card
                  </SelectItem>
                  <SelectItem value="bank" className="text-popover-foreground hover:bg-accent">
                    Bank Transfer
                  </SelectItem>
                  <SelectItem value="crypto" className="text-popover-foreground hover:bg-accent">
                    Cryptocurrency
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3 rounded-md bg-[#0a0812] p-3 border border-[#2C2C2E]">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-[#888888]">
                <span>Commission ({(commissionRate * 100).toFixed(1)}%)</span>
                <InfoIcon className="h-3.5 w-3.5 ml-1" />
              </div>
              <span className="text-[#888888]">-${commissionAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#2C2C2E]">
              <span className="font-medium">Final Amount</span>
              <span className="text-lg font-semibold">${finalAmount.toFixed(2)}</span>
            </div>

            <div className="text-xs flex items-center text-[#888888]">
              <InfoIcon className="h-3 w-3 mr-1" />
              <span>Commission based on {customerTier.charAt(0).toUpperCase() + customerTier.slice(1)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="border-[#2C2C2E]">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!amount || isSubmitting}
            className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
          >
            {isSubmitting ? contentTokens.loading.processing : "Top Up Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AccountTopUpDialogProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  accountName: string
  currentBalance: string
  onTopUp?: (amount: number) => void
}

export function AccountTopUpDialog({
  isOpen,
  onClose,
  accountId,
  accountName,
  currentBalance,
  onTopUp,
}: AccountTopUpDialogProps) {
  // Parse currentBalance string to number. Handle potential NaN.
  const numericBalance = Number.parseFloat(currentBalance.replace(/[^0-9.-]+/g, "") || "0")

  if (!isOpen) {
    return null
  }

  return (
    <TopUpDialogInternal
      isOpen={isOpen}
      onClose={onClose}
      accountId={accountId}
      accountName={accountName}
      onTopUp={onTopUp}
      walletBalance={numericBalance} // This was passing currentBalance which is a string, fixed to numericBalance
    />
  )
} 