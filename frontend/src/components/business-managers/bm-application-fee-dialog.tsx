'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Building2, Check } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { getActiveBmLimit, shouldEnableBmApplicationFees, getBmApplicationFee } from "@/lib/config/pricing-config"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useWalletBalance } from "@/hooks/useWalletBalance"

interface BmApplicationFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  currentBmApplications: number
  existingBmCount?: number // How many BMs they already have (for fee calculation)
}

export function BmApplicationFeeDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  currentBmApplications,
  existingBmCount = 0
}: BmApplicationFeeDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [realTimeBmCount, setRealTimeBmCount] = useState<number | null>(null)
  const { currentPlan } = useSubscription()
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const { balance: walletBalance, refreshBalance } = useWalletBalance()

  // Fetch real-time BM count when dialog opens
  useEffect(() => {
    if (open && currentOrganizationId && session?.access_token) {
      const fetchRealTimeBmCount = async () => {
        try {
          const response = await fetch(`/api/organizations/${currentOrganizationId}/active-bm-count`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setRealTimeBmCount(data.totalBMs)
          }
        } catch (error) {
          console.error('Failed to fetch real-time BM count:', error)
        }
      }
      
      fetchRealTimeBmCount()
    }
  }, [open, currentOrganizationId, session?.access_token])

  if (!currentPlan) return null

  // Get BM application fee for current plan
  const bmApplicationFee = getBmApplicationFee(currentPlan.id as 'starter' | 'growth' | 'scale')
  const maxActiveBms = getActiveBmLimit(currentPlan.id as 'starter' | 'growth' | 'scale')

  // Determine if this BM application should be free (first BM is always free)
  const isFirstBm = existingBmCount === 0
  const actualFee = isFirstBm ? 0 : bmApplicationFee
  const hasInsufficientBalance = actualFee > 0 && walletBalance !== null && walletBalance < actualFee

  if (!maxActiveBms) {
    // No limits, proceed directly
    onConfirm()
    return null
  }

  // Use real-time count if available, otherwise fall back to props
  const effectiveBmCount = realTimeBmCount !== null ? realTimeBmCount : currentBmApplications
  const isAtLimit = effectiveBmCount >= maxActiveBms
  const remainingSlots = maxActiveBms - effectiveBmCount

  // Debug logging for BM limits
  console.log('🔍 BM Application Dialog Debug:', {
    currentBmApplications,
    realTimeBmCount,
    effectiveBmCount,
    maxActiveBms,
    isAtLimit,
    remainingSlots,
    planName: currentPlan.name
  })

  const handleConfirm = async () => {
    if (isAtLimit) {
      toast.error(`You've reached the maximum of ${maxActiveBms} active Business Managers for your ${currentPlan.name} plan. Please upgrade to apply for more.`)
      return
    }

    setIsProcessing(true)
    try {
      if (actualFee > 0) {
        // Process BM application fee via wallet deduction
        const response = await fetch('/api/business-managers/apply-fee', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            organizationId: currentOrganizationId,
            existingBmCount: existingBmCount
          })
        })

        const result = await response.json()

        if (!response.ok) {
          if (result.error === 'Insufficient wallet balance') {
            toast.error(
              `Insufficient wallet balance. You need $${result.required} but only have $${result.available}. Please add $${result.shortfall} to your wallet.`,
              { duration: 6000 }
            )
          } else {
            toast.error(result.error || 'Failed to process BM application fee')
          }
          return
        }

        // Show success message for fee deduction
        if (result.fee > 0) {
          toast.success(`Successfully charged $${result.fee} BM application fee. New wallet balance: $${result.newBalance}`)
          // Refresh wallet balance to show updated amount
          refreshBalance()
        } else {
          toast.success(result.message)
        }
      }
      
      onConfirm()
    } catch (error) {
      console.error('Error processing BM application:', error)
      toast.error('Failed to process application')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Manager Application
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Your {currentPlan.name} Plan</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Active BMs:</span>
                <span>{effectiveBmCount} / {maxActiveBms}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining slots:</span>
                <span>{remainingSlots}</span>
              </div>
              <div className="flex justify-between">
                <span>Application cost:</span>
                <span className={actualFee === 0 ? "text-foreground font-medium" : "text-amber-600 font-medium"}>
                  {actualFee === 0 ? 'Free' : `$${actualFee}`}
                </span>
              </div>
            </div>
          </div>

          {/* Application Info */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Application Details</h4>
            
            {!isAtLimit ? (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-foreground" />
                <span className="font-medium">
                  {actualFee === 0 ? (
                    <span className="text-foreground">
                      {isFirstBm ? 'First BM - Free!' : 'Free Business Manager Application'}
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      Additional BM - ${actualFee} fee
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                You've reached your plan limit for active Business Managers.
              </div>
            )}
            
            <div className="mt-3 text-sm text-muted-foreground">
              <p>
                Your {currentPlan.name} plan includes {maxActiveBms} active Business Manager{maxActiveBms > 1 ? 's' : ''}.
                {actualFee > 0 && (
                  <>
                    <br />
                    <strong>Note:</strong> Your first Business Manager is always free. 
                    Additional BMs cost ${bmApplicationFee} each on the {currentPlan.name} plan.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Warning for limit */}
          {isAtLimit && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Plan Limit Reached</p>
                  <p className="text-amber-700">
                    You've reached the maximum of {maxActiveBms} active Business Managers. 
                    Please upgrade your plan to apply for more.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isProcessing || isAtLimit}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
            >
              {isProcessing ? 'Processing...' : (
                actualFee === 0 ? 'Apply for Free' : `Apply ($${actualFee})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 