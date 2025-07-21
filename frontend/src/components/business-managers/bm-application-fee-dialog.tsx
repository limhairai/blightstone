'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Building2, Check } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"
import { getActiveBmLimit, shouldEnableBmApplicationFees, getBmApplicationFee } from "@/lib/config/pricing-config"
import { toast } from "sonner"

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
  const { currentPlan } = useSubscription()

  if (!currentPlan) return null

  // Get BM application fee for current plan
  const bmApplicationFee = getBmApplicationFee(currentPlan.id as 'starter' | 'growth' | 'scale')
  const maxActiveBms = getActiveBmLimit(currentPlan.id as 'starter' | 'growth' | 'scale')

  // Determine if this BM application should be free (first BM is always free)
  const isFirstBm = existingBmCount === 0
  const actualFee = isFirstBm ? 0 : bmApplicationFee

  if (!maxActiveBms) {
    // No limits, proceed directly
    onConfirm()
    return null
  }

  const isAtLimit = currentBmApplications >= maxActiveBms
  const remainingSlots = maxActiveBms - currentBmApplications

  const handleConfirm = async () => {
    if (isAtLimit) {
      toast.error(`You've reached the maximum of ${maxActiveBms} active Business Managers for your ${currentPlan.name} plan. Please upgrade to apply for more.`)
      return
    }

    setIsProcessing(true)
    try {
      if (actualFee > 0) {
        // TODO: Integrate with payment processing for BM application fee
        // For now, just show a message about the fee
        toast.info(`This application will incur a $${actualFee} fee. Payment processing will be added soon.`)
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
                <span>{currentBmApplications} / {maxActiveBms}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining slots:</span>
                <span>{remainingSlots}</span>
              </div>
              <div className="flex justify-between">
                <span>Application cost:</span>
                <span className={actualFee === 0 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
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
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium">
                  {actualFee === 0 ? (
                    <span className="text-green-600">
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
              className="flex-1 bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black border-0"
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