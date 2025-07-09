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
import { Label } from "@/components/ui/label"
import { Check, Loader2, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { validateBusinessManagerApplicationForm, showValidationErrors } from "@/lib/form-validation"
import { useSubscription } from "@/hooks/useSubscription"
import { refreshAfterBusinessManagerChange } from "@/lib/subscription-utils"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { mutate } from 'swr'

interface ApplyForBmDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ApplyForBmDialog({ children, onSuccess }: ApplyForBmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()
  const { subscriptionData, usage, checkLimit } = useSubscription()
  const { currentOrganizationId } = useOrganizationStore()

  // Check if organization is on free plan or cannot request assets
  const isOnFreePlan = subscriptionData?.free || subscriptionData?.subscriptionStatus === 'free'
  const canRequestAssets = subscriptionData?.canRequestAssets !== false
  const subscriptionMessage = subscriptionData?.message
  
  // Check if user has reached business manager limit
  const canAddMoreBMs = checkLimit('businessManagers', usage?.businessManagers || 0)
  const hasReachedBMLimit = !canAddMoreBMs && !isOnFreePlan

  const [formData, setFormData] = useState({
    website: "",
  })

  const resetForm = () => {
    setFormData({
      website: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check subscription status before allowing submission
    if (isOnFreePlan || !canRequestAssets) {
      toast.error("Upgrade Required", {
        description: subscriptionMessage || "Please upgrade your plan to apply for business managers.",
      });
      return;
    }

    // Check business manager limit
    if (hasReachedBMLimit) {
      toast.error("Plan Limit Reached", {
        description: "You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers.",
      });
      return;
    }

    // Validate form
    if (!formData.website.trim()) {
      toast.error('Website is required');
      return;
    }

    setIsSubmitting(true)
    try {
      // Get current organization
      const orgsResponse = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      })

      if (!orgsResponse.ok) {
        throw new Error('Failed to fetch organization')
      }

      const orgsData = await orgsResponse.json()
      const organizationId = orgsData.organizations?.[0]?.organization_id

      if (!organizationId) {
        throw new Error('No organization found')
      }

      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          type: 'business_manager',
          website_url: formData.website,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit application')
      }

      const result = await response.json()

      // Show success toast
      toast.success("Application submitted successfully!", {
        description: "Your business manager application is now under review."
      })
      
      // Refresh the data
      if (onSuccess) {
        onSuccess()
      }
      
      setOpen(false)

    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error("Failed to submit application", {
        description: "Please try again or contact support if the issue persists."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Check className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-1">Application Submitted</h3>
            <p className="text-sm text-muted-foreground">
              Your business manager application has been submitted for review.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Apply for Business Manager
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit your business information for review and approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-foreground">
              Website *
            </Label>
            <Input
              id="website"
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://your-website.com or your-website.com"
              required
              className="bg-background border-border text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Enter your website URL in any format: domain.com, www.domain.com, or https://domain.com
            </p>
          </div>

          {(isOnFreePlan || !canRequestAssets || hasReachedBMLimit) ? (
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">
                {hasReachedBMLimit ? "Plan Limit Reached" : "Upgrade Required"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {hasReachedBMLimit 
                  ? "You have reached the maximum number of business managers for your current plan. Please upgrade to add more business managers."
                  : (subscriptionMessage || "Business manager applications are available on paid plans only. Please upgrade your plan to continue.")
                }
              </p>
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
              <h4 className="text-sm font-medium text-foreground mb-2">What happens next?</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Your application will be reviewed within 1-3 business days</li>
                <li>• Once approved, you&apos;ll receive your Business Manager ID</li>
                <li>• You can then start creating ad accounts and campaigns</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="bg-background border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isOnFreePlan || !canRequestAssets || hasReachedBMLimit}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 