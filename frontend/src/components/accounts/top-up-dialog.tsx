"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Wallet, DollarSign } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { formatCurrency } from "@/utils/format"
import { toast } from "sonner"

const MINIMUM_TOP_UP_AMOUNT = 500;

interface TopUpDialogProps {
  trigger: React.ReactNode
  account?: {
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
  }
  accounts?: Array<{
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
  }>
  onSuccess?: () => void
}

export function TopUpDialog({ trigger, account, accounts, onSuccess }: TopUpDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()

  const [formData, setFormData] = useState({
    amount: "",
  })

  const isMultipleAccounts = accounts && accounts.length > 0
  const targetAccounts = isMultipleAccounts ? accounts : account ? [account] : []

  const resetForm = () => {
    setFormData({
      amount: "",
    })
  }

  const validateAmount = (amount: string): string | null => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      return "Please enter a valid amount.";
    }
    
    if (numAmount <= 0) {
      return "Amount must be greater than $0.";
    }
    
    if (numAmount < MINIMUM_TOP_UP_AMOUNT) {
      return `Minimum top up amount is $${MINIMUM_TOP_UP_AMOUNT}.`;
    }
    
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateAmount(formData.amount);
    if (validationError) {
      toast.error("Invalid Amount", {
        description: validationError,
      });
      return;
    }

    setIsLoading(true)

    try {
      const requests = targetAccounts.map(acc => ({
        ad_account_id: acc.adAccount,
        amount: parseFloat(formData.amount),
      }))

      for (const request of requests) {
        const response = await fetch('/api/top-up-requests', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit top up request');
        }
      }

      setShowSuccess(true)
      toast.success("Top Up Request Submitted!", {
        description: isMultipleAccounts 
          ? `Top up requests for ${targetAccounts.length} accounts have been submitted.`
          : "Your top up request has been submitted for review.",
      });

      // Call the callback
      if (onSuccess) {
        onSuccess()
      }

      // Close dialog after success
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
        resetForm()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error("Submission Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground">
              {isMultipleAccounts 
                ? `Your top up requests for ${targetAccounts.length} accounts have been submitted for review.`
                : "Your top up request has been submitted for review."
              }
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const totalCurrentBalance = targetAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const amountError = formData.amount ? validateAmount(formData.amount) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#c4b5fd]" />
            {isMultipleAccounts ? `Top Up ${targetAccounts.length} Accounts` : "Top Up Account"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isMultipleAccounts 
              ? "Request a top up for the selected ad accounts."
              : "Request a top up for this ad account."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Summary */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">
              {isMultipleAccounts ? "Selected Accounts" : "Account Details"}
            </h4>
            {isMultipleAccounts ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {targetAccounts.length} accounts selected
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Current Balance: </span>
                  <span className="font-medium text-foreground">${formatCurrency(totalCurrentBalance)}</span>
                </div>
              </div>
            ) : account ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Account: </span>
                  <span className="font-medium text-foreground">{account.name}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Balance: </span>
                  <span className="font-medium text-foreground">${formatCurrency(account.balance)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Account ID: </span>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{account.adAccount}</code>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground">
              Top Up Amount (USD) *
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="1"
                min={MINIMUM_TOP_UP_AMOUNT}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={`${MINIMUM_TOP_UP_AMOUNT}.00`}
                required
                className={`pl-10 bg-background border-border text-foreground ${
                  amountError ? 'border-red-500' : ''
                }`}
              />
            </div>
            {amountError && (
              <p className="text-xs text-red-500">{amountError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum amount: ${MINIMUM_TOP_UP_AMOUNT}. {isMultipleAccounts 
                ? "This amount will be added to each selected account."
                : "Amount to add to the account balance."
              }
            </p>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your top up request will be processed within the next 2-3 hours</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !!amountError || !formData.amount}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 