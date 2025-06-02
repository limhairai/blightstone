"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, AlertCircle, Wallet } from "lucide-react"

interface TopUpDialogPropsInternal {
  isOpen: boolean
  onClose: () => void
  accountId: string
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

// Renamed to avoid conflict with the wrapper export
function TopUpDialogInternal({ isOpen, onClose, accountId, accountName, onTopUp }: TopUpDialogPropsInternal) {
  // Mock data
  const walletBalance = 5000
  const customerTier = "BASIC"
  const commissionRate = CUSTOMER_TIERS[customerTier].commissionRate

  const [amount, setAmount] = useState<number>(100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

          <div className="space-y-3">
            <Label className="text-[#888888]">Select Amount to Top Up</Label>

            <div className="grid grid-cols-4 gap-2">
              {predefinedAmounts.map((presetAmount) => (
                <Button
                  key={presetAmount}
                  type="button"
                  variant={amount === presetAmount ? "default" : "outline"}
                  onClick={() => handleAmountChange(presetAmount)}
                  className={`h-10 ${amount === presetAmount ? "bg-[#b19cd9] text-black" : "bg-transparent text-white border-[#2C2C2E]"}`}
                >
                  ${presetAmount}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-[#888888]">Custom Amount</Label>
                <Label className="text-white font-medium">${amount}</Label>
              </div>
              <Slider
                value={[amount]}
                min={10}
                max={Math.min(2000, walletBalance)}
                step={10}
                onValueChange={(values) => handleAmountChange(values[0])}
                className="my-4"
              />

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(Number(e.target.value))}
                  className="pl-8 bg-[#0a0812] border-[#2C2C2E]"
                  min={0}
                  max={walletBalance}
                />
              </div>
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
          <Button variant="outline" onClick={onClose} className="border-[#2C2C2E]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!error || amount <= 0}
            className="bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90"
          >
            {isSubmitting ? "Processing..." : "Top Up Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AccountTopUpDialogProps {
  accountId: string
  accountName: string
  currentBalance: string
  children?: React.ReactNode
  className?: string
}

export function AccountTopUpDialog({
  accountId,
  accountName,
  currentBalance,
  children,
  className,
}: AccountTopUpDialogProps) {
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false)

  const handleTopUp = (amount: number) => {
    console.log(`Topping up ${accountName} (${accountId}) with $${amount}`)
    // In a real app, you would call an API here
  }

  return (
    <>
      {children ? (
        <div className={className} onClick={() => setIsTopUpDialogOpen(true)}>
          {children}
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={`bg-gradient-to-r from-[#b19cd9] to-[#f8c4b4] text-black hover:opacity-90 ${className}`}
          onClick={() => setIsTopUpDialogOpen(true)}
        >
          <Wallet className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      )}

      <TopUpDialogInternal
        isOpen={isTopUpDialogOpen}
        onClose={() => setIsTopUpDialogOpen(false)}
        accountId={accountId}
        accountName={accountName}
        onTopUp={handleTopUp}
      />
    </>
  )
}
