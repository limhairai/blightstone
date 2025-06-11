"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Slider } from "../ui/slider"
import { Alert, AlertDescription } from "../ui/alert"
import { InfoIcon, AlertCircle, Wallet } from "lucide-react"
import { formatCurrency } from "../../lib/mock-data"
import { contentTokens } from "../../lib/content-tokens"
import { layout } from "../../lib/layout-utils"
import { useDemoState } from "../../contexts/DemoStateContext"
import { validateForm, validators, showValidationErrors, showSuccessToast } from "../../lib/form-validation"

interface TopUpDialogProps {
  isOpen: boolean
  onClose: () => void
  accountId: string | number
  accountName: string
  onTopUp?: (amount: number) => void
}

// Mock data for customer tiers and their commission rates
const CUSTOMER_TIERS = {
  FREE: { commissionRate: 0.05, name: "Free Plan" },
  BASIC: { commissionRate: 0.03, name: "Basic Plan" },
  PRO: { commissionRate: 0.02, name: "Pro Plan" },
  ENTERPRISE: { commissionRate: 0.01, name: "Enterprise Plan" },
}

export function TopUpDialog({ isOpen, onClose, accountId, accountName, onTopUp }: TopUpDialogProps) {
  const { state, topUpAccount } = useDemoState()
  
  // Use real-time wallet balance from demo state
  const walletBalance = state.financialData.walletBalance
  const customerTier = "BASIC"
  const commissionRate = CUSTOMER_TIERS[customerTier].commissionRate

  const [amount, setAmount] = useState<number>(100)
  const [error, setError] = useState<string | null>(null)

  // Get loading state
  const isSubmitting = state.loading.accounts

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

  const predefinedAmounts = [50, 100, 500, 1000]

  const commissionAmount = amount * commissionRate
  const finalAmount = amount - commissionAmount

  const handleSubmit = async () => {
    // Comprehensive form validation
    const validation = validateForm([
      () => validators.required(amount.toString(), 'Amount'),
      () => amount <= 0 ? { field: 'amount', message: 'Please enter a valid positive amount' } : null,
      () => amount > walletBalance ? { field: 'amount', message: 'Amount exceeds available wallet balance' } : null,
      () => amount > 50000 ? { field: 'amount', message: 'Maximum top-up amount is $50,000' } : null,
      () => amount < 50 ? { field: 'amount', message: 'Minimum top-up amount is $50' } : null,
    ])
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    try {
      // Convert accountId to number if it's a string
      const numericAccountId = typeof accountId === 'string' ? parseInt(accountId) : accountId

      // Use the actual topUpAccount function from state management
      await topUpAccount(numericAccountId, amount)

      showSuccessToast("Account Topped Up!", `$${amount} has been added to ${accountName}.`)

      // Call the optional callback
      if (onTopUp) {
        onTopUp(amount)
      }

      onClose()
    } catch (error) {
      showValidationErrors([{ field: 'general', message: 'Failed to top up account. Please try again.' }])
    }
  }

  const quickAmounts = [100, 500, 1000, 5000]

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
              <div className="text-lg font-semibold">${formatCurrency(walletBalance)}</div>
            </div>
            <Wallet className="h-5 w-5 text-[#888888]" />
          </div>

          <div className={layout.stackMedium}>
            <div className={layout.formFields}>
              <Label className="text-foreground">Quick amounts</Label>
            <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) => (
                <Button
                    key={quickAmount}
                  type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAmountChange(quickAmount)}
                    className="border-border text-foreground hover:bg-accent"
                    disabled={isSubmitting}
                >
                    ${quickAmount}
                </Button>
              ))}
              </div>
            </div>

            <div className={layout.formFields}>
              <Label htmlFor="amount" className="text-foreground">
                {contentTokens.labels.amount} <span className="text-red-500">*</span>
              </Label>
                <Input
                id="amount"
                  type="number"
                  value={amount}
                onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="bg-background border-border text-foreground"
                disabled={isSubmitting}
                />
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
              <span>Commission based on {CUSTOMER_TIERS[customerTier].name}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="border-[#2C2C2E]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!amount || isSubmitting || amount > walletBalance}
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              "Top Up Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
