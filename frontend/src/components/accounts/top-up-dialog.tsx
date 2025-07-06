"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

import { Label } from "@/components/ui/label"
// Removed old useToast - using toast from sonner instead
import { Check, Loader2, Wallet, DollarSign, Calculator, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { formatCurrency } from "@/utils/format"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useCurrentOrganization } from "@/lib/swr-config"
import { useSWRConfig } from 'swr'

const MINIMUM_TOP_UP_AMOUNT = 500;

interface TopUpDialogProps {
  trigger: React.ReactNode
  account?: {
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
    business?: string
    bmId?: string
  }
  accounts?: Array<{
    id: string
    name: string
    adAccount: string
    balance: number
    currency: string
    business?: string
    bmId?: string
  }>
  onSuccess?: () => void
}

export function TopUpDialog({ trigger, account, accounts, onSuccess }: TopUpDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()
  const { calculateFee, currentPlan, subscriptionData } = useSubscription()
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId)

  const [formData, setFormData] = useState({
    amount: "",
  })
  const [feeCalculation, setFeeCalculation] = useState<any>(null)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)

  // Get wallet balance from SWR hook (same as topbar)
  const walletBalance = orgData?.organizations?.[0]?.balance_cents ? orgData.organizations[0].balance_cents / 100 : 0
  const isLoadingBalance = isOrgLoading

  const isMultipleAccounts = accounts && accounts.length > 0
  const targetAccounts = isMultipleAccounts ? accounts : account ? [account] : []

  // Check if organization is on free plan
  const isOnFreePlan = subscriptionData?.free || subscriptionData?.subscriptionStatus === 'free'
  const subscriptionMessage = subscriptionData?.message

  // Calculate fee when amount changes
  useEffect(() => {
    const calculateTopupFee = async () => {
      const amount = parseFloat(formData.amount)
      if (amount > 0 && currentOrganizationId && !isOnFreePlan) {
        setIsCalculatingFee(true)
        try {
          const calculation = await calculateFee(amount)
          setFeeCalculation(calculation)
        } catch (error) {
          console.error('Error calculating fee:', error)
          setFeeCalculation(null)
        } finally {
          setIsCalculatingFee(false)
        }
      } else {
        setFeeCalculation(null)
      }
    }

    const debounceTimer = setTimeout(calculateTopupFee, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.amount, currentOrganizationId, calculateFee, isOnFreePlan])

  const resetForm = () => {
    setFormData({
      amount: "",
    })
    setFeeCalculation(null)
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

    // Check if total amount (including fee) exceeds wallet balance
    const totalAmount = feeCalculation?.total_amount || numAmount
    if (totalAmount > walletBalance) {
      return `Total amount including fees (${formatCurrency(totalAmount)}) exceeds your wallet balance of ${formatCurrency(walletBalance)}`;
    }
    
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check subscription status before allowing submission
    if (isOnFreePlan) {
      toast.error("Upgrade Required", {
        description: subscriptionMessage || "Please upgrade your plan to submit topup requests.",
      });
      return;
    }
    
    const validationError = validateAmount(formData.amount);
    if (validationError) {
      toast.error("Invalid Amount", {
        description: validationError,
      });
      return;
    }

    setIsLoading(true)

    try {
      const requests = targetAccounts.map(acc => {
        // Ensure we have proper business manager metadata
        let businessManagerName = (acc as any).business || 'Unknown';
        let businessManagerId = (acc as any).bmId || 'Unknown';
        
        // If the business manager info is still unknown/missing, 
        // it will be enhanced by the API using the asset system
        if (businessManagerName === 'Unknown' || businessManagerName === 'N/A') {
          businessManagerName = 'BM Not Available';
        }
        
        if (businessManagerId === 'Unknown' || !businessManagerId) {
          businessManagerId = 'BM ID Not Available';
        }

        return {
          organization_id: currentOrganizationId,
          ad_account_id: acc.adAccount,
          ad_account_name: acc.name,
          amount_cents: Math.round(parseFloat(formData.amount) * 100),

      
          // Include fee calculation data
          fee_amount_cents: feeCalculation ? Math.round(feeCalculation.fee_amount * 100) : 0,
          total_deducted_cents: feeCalculation ? Math.round(feeCalculation.total_amount * 100) : Math.round(parseFloat(formData.amount) * 100),
          plan_fee_percentage: feeCalculation?.fee_percentage || 0,
          // Include business manager metadata with better fallbacks
          metadata: {
            business_manager_name: businessManagerName,
            business_manager_id: businessManagerId
          }
        }
      })

      for (const request of requests) {
        const response = await fetch('/api/topup-requests', {
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

      // Refresh wallet balance and organization data
      if (currentOrganizationId) {
        await Promise.all([
          mutate(`/api/organizations?id=${currentOrganizationId}`),
          mutate('/api/organizations'),
          mutate(`org-${currentOrganizationId}`)
        ]);
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

        {/* Free Plan Upgrade Warning */}
        {isOnFreePlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Upgrade Required</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {subscriptionMessage || "You're on the free plan. Upgrade to access topup functionality and all features."}
            </p>
          </div>
        )}

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

          {/* Wallet Balance */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            <div className="text-lg font-semibold">
              {isLoadingBalance ? (
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              ) : (
                formatCurrency(walletBalance)
              )}
            </div>
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
                disabled={isOnFreePlan}
                className={`pl-10 bg-background border-border text-foreground ${
                  amountError ? 'border-red-500' : ''
                } ${isOnFreePlan ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          {/* Fee Calculation Display */}
          {formData.amount && parseFloat(formData.amount) > 0 && !isOnFreePlan && (
            <div className="p-4 bg-muted/50 border border-border rounded-md space-y-2">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Calculator className="h-4 w-4" />
                Cost Breakdown
              </div>
              
              {isCalculatingFee ? (
                <div className="text-sm text-muted-foreground">Calculating fees...</div>
              ) : feeCalculation ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top-up Amount:</span>
                    <span className="text-foreground">{formatCurrency(feeCalculation.base_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee ({feeCalculation.fee_percentage}%):</span>
                    <span className="text-orange-500">+{formatCurrency(feeCalculation.fee_amount)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground border-t border-border pt-1">
                    <span>Total Deducted:</span>
                    <span>{formatCurrency(feeCalculation.total_amount)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Enter amount to see fee calculation</div>
              )}
            </div>
          )}

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
              disabled={
                isLoading || 
                !!amountError || 
                !formData.amount || 
                isCalculatingFee ||
                isOnFreePlan ||
                (feeCalculation && feeCalculation.total_amount > walletBalance)
              }
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
                  {isOnFreePlan ? "Upgrade Required" : "Submit Request"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 