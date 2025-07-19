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
import { Check, Loader2, Wallet, DollarSign, Calculator, AlertTriangle, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { formatCurrency } from "@/utils/format"
import { toast } from "sonner"
import { useSubscription } from "@/hooks/useSubscription"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useCurrentOrganization } from "@/lib/swr-config"
import { useSWRConfig } from 'swr'

import { shouldEnableTopupLimits, shouldEnableAdSpendFees } from '@/lib/config/pricing-config'



const MINIMUM_TOP_UP_AMOUNT = 100;

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
  const [limitInfo, setLimitInfo] = useState<any>(null)

  // Top-up limits are handled by the backend during payment processing

  // Get wallet balance from SWR hook (same as topbar)
  const walletBalance = orgData?.organizations?.[0]?.balance_cents ? orgData.organizations[0].balance_cents / 100 : 0
  const isLoadingBalance = isOrgLoading

  const isMultipleAccounts = accounts && accounts.length > 0
  const targetAccounts = isMultipleAccounts ? accounts : account ? [account] : []

  // Check if organization is on free plan
  const isOnFreePlan = subscriptionData?.free || subscriptionData?.subscriptionStatus === 'free'
  const subscriptionMessage = subscriptionData?.message

  // Calculate fee when amount changes (only if feature is enabled)
  useEffect(() => {
    const calculateTopupFee = async () => {
      const amount = parseFloat(formData.amount)
      if (amount > 0 && currentOrganizationId && !isOnFreePlan && shouldEnableAdSpendFees()) {
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
        // For 0% fee plans or when fees are disabled, create a 0% calculation
        if (amount > 0 && !isOnFreePlan) {
          setFeeCalculation({
            base_amount: amount,
            fee_amount: 0,
            total_amount: amount,
            fee_percentage: 0
          })
        } else {
          setFeeCalculation(null)
        }
      }
    }

    const debounceTimer = setTimeout(calculateTopupFee, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.amount, currentOrganizationId, calculateFee, isOnFreePlan])

  // Fetch top-up limit information
  useEffect(() => {
    const fetchLimitInfo = async () => {
      if (!currentOrganizationId || !shouldEnableTopupLimits()) {
        setLimitInfo(null)
        return
      }

      try {
        const { getPlanPricing } = await import('@/lib/config/pricing-config')
        
        // Get current plan from subscription data
        const planId = currentPlan?.id as 'starter' | 'growth' | 'scale'
        if (!planId) {
          setLimitInfo(null)
          return
        }

        const planLimits = getPlanPricing(planId)
        if (!planLimits) {
          setLimitInfo(null)
          return
        }

        // Fetch actual monthly usage from the API
        let currentUsage = 0
        try {
          const usageResponse = await fetch(`/api/topup-usage?organization_id=${currentOrganizationId}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          })
          
          if (usageResponse.ok) {
            const usageData = await usageResponse.json()
            currentUsage = usageData.currentUsage
          }
        } catch (error) {
          console.error('Error fetching monthly usage:', error)
          // Continue with 0 usage if fetch fails
        }

        const available = planLimits.monthlyTopupLimit - currentUsage

        setLimitInfo({
          hasLimit: true,
          limit: planLimits.monthlyTopupLimit,
          currentUsage,
          available: Math.max(0, available),
          planName: planId,
          allowed: available > 0
        })
      } catch (error) {
        console.error('Error fetching limit info:', error)
        setLimitInfo(null)
      }
    }

    fetchLimitInfo()
  }, [currentOrganizationId, currentPlan, session])

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
      return `Minimum top up amount is ${MINIMUM_TOP_UP_AMOUNT}.`;
    }

    // Calculate total amount using actual fee calculation if available
    const totalAmount = feeCalculation ? feeCalculation.total_amount : numAmount;
    
    if (totalAmount > walletBalance) {
      return `Total amount including fees (${formatCurrency(totalAmount)}) exceeds your wallet balance of ${formatCurrency(walletBalance)}`;
    }

    // Top-up limits are validated by the backend during submission
    // Frontend just shows the limit information for user reference
    
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

      // OPTIMISTIC UPDATE: Show balance change immediately
      if (currentOrganizationId) {
        const amountCents = Math.round(parseFloat(formData.amount) * 100)
        
        // 1. Immediately update the UI
        mutate([`/api/organizations?id=${currentOrganizationId}`, session?.access_token], (currentData: any) => {
          if (currentData?.organizations?.[0]) {
            const org = { ...currentData.organizations[0] }
            
            // Optimistically reduce available balance (reserved for topup)
            org.balance_cents -= amountCents
            org.balance = org.balance_cents / 100
            
            // Increase reserved balance
            org.reserved_balance_cents = (org.reserved_balance_cents || 0) + amountCents
            
            if (org.wallets) {
              org.wallets.balance_cents = org.balance_cents
              org.wallets.reserved_balance_cents = org.reserved_balance_cents
            }
            
            return { organizations: [org] }
          }
          return currentData
        }, false) // Don't revalidate immediately - show optimistic update
        
        // 2. Server will handle the actual topup request
        // 3. UI will sync with server response automatically
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
        <DialogContent className="sm:max-w-xl bg-card border-border">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Request Submitted</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {isMultipleAccounts 
                ? `Your top up requests for ${targetAccounts.length} accounts have been submitted for review.`
                : "Your top up request has been submitted for review. You'll be notified once it's processed."
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
      <DialogContent className="sm:max-w-4xl bg-card border-border max-h-[90vh] p-0">


        {/* Free Plan Upgrade Warning */}
        {isOnFreePlan && (
          <div className="mx-6 mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Upgrade Required</span>
            </div>
            <p className="text-sm text-blue-300 mt-1">
              {subscriptionMessage || "You're on the free plan. Upgrade to access topup functionality and all features."}
            </p>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 pb-8 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Account & Balance Info */}
            <div className="space-y-4">
              {/* Account Summary */}
              <div className="bg-muted/20 p-4 rounded-lg border border-muted/40">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  {isMultipleAccounts ? "Selected Accounts" : "Account Details"}
                </h3>
                {isMultipleAccounts ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Accounts:</span>
                      <span className="text-sm font-medium text-foreground">{targetAccounts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Balance:</span>
                      <span className="text-sm font-medium text-foreground">${formatCurrency(totalCurrentBalance)}</span>
                    </div>
                  </div>
                ) : account ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account:</span>
                      <span className="text-sm font-medium text-foreground">{account.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Balance:</span>
                      <span className="text-sm font-medium text-foreground">${formatCurrency(account.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">ID:</span>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded text-muted-foreground">{account.adAccount}</code>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Wallet Balance */}
              <div className="bg-muted/20 p-4 rounded-lg border border-muted/40">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Wallet Balance</h3>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {isLoadingBalance ? (
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                  ) : (
                    `$${formatCurrency(walletBalance)}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Available for top-ups</p>
              </div>

              {/* Monthly Limits */}
              {shouldEnableTopupLimits() && limitInfo && (
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/40">
                  <h3 className="text-sm font-medium text-foreground mb-3">Monthly Limits</h3>
                  {limitInfo.hasLimit ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Monthly Limit:</p>
                        <p className="font-medium text-foreground">
                          {limitInfo.limit === -1 ? 'Unlimited' : formatCurrency(limitInfo.limit)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Used:</p>
                        <p className="font-medium text-foreground">{formatCurrency(limitInfo.currentUsage)}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Available:</p>
                        <p className={`font-medium ${limitInfo.available > 0 || limitInfo.limit === -1 ? 'text-green-500' : 'text-red-500'}`}>
                          {limitInfo.limit === -1 ? 'Unlimited' : formatCurrency(limitInfo.available)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-400">
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Unlimited top-ups ({limitInfo.planName})</span>
                    </div>
                  )}
                </div>
              )}


            </div>

            {/* Right Column - Top-up Form */}
            <div className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Amount Input */}
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/40">
                  <Label htmlFor="amount" className="text-sm font-medium text-foreground mb-3 block">
                    Top-up Amount (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                      className={`pl-12 h-12 text-lg bg-background border-border text-foreground ${
                        amountError ? 'border-red-500' : ''
                      } ${isOnFreePlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {amountError && (
                    <p className="text-xs text-red-400 mt-2">{amountError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum: $100. {isMultipleAccounts 
                      ? "Amount added to each selected account."
                      : "Amount added to account balance."
                    }
                  </p>
                </div>

                {/* Fee Calculation - Always Reserve Space */}
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/40 min-h-[120px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Cost Breakdown</h3>
                  </div>
                  
                  {!formData.amount || parseFloat(formData.amount) <= 0 || isOnFreePlan ? (
                    <div className="text-sm text-muted-foreground">
                      Enter an amount to see cost breakdown
                    </div>
                  ) : isCalculatingFee ? (
                    <div className="text-sm text-muted-foreground">
                      Calculating fees...
                    </div>
                  ) : feeCalculation ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Top-up amount:</span>
                        <span className="text-sm font-medium text-foreground">${formatCurrency(parseFloat(formData.amount))}</span>
                      </div>
                      {feeCalculation.fee_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Platform fee ({feeCalculation.fee_percentage}%):</span>
                          <span className="text-sm font-medium text-orange-400">+${formatCurrency(feeCalculation.fee_amount)}</span>
                        </div>
                      )}
                      <div className="border-t border-muted/40 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">Total deducted:</span>
                          <span className="text-sm font-bold text-foreground">${formatCurrency(feeCalculation.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Top-up amount:</span>
                        <span className="text-sm font-medium text-foreground">${formatCurrency(parseFloat(formData.amount))}</span>
                      </div>
                      <div className="border-t border-muted/40 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-foreground">Total deducted:</span>
                          <span className="text-sm font-bold text-foreground">${formatCurrency(parseFloat(formData.amount))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Processing Info */}
                <div className="bg-muted/20 p-4 rounded-lg border border-muted/40">
                  <p className="text-sm text-muted-foreground">
                    Requests are processed within 2-3 hours during business hours
                  </p>
                </div>

                {/* Submit Button */}
                <div>
                  <Button
                    type="submit"
                  disabled={
                    isLoading || 
                    !!amountError || 
                    !formData.amount || 
                    isOnFreePlan
                  }
                  className="w-full bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0 h-12 text-base font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      {isOnFreePlan ? "Upgrade Required" : isMultipleAccounts ? "Top Up Accounts" : "Top Up Account"}
                    </>
                                      )}
                  </Button>
                </div>
                </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 