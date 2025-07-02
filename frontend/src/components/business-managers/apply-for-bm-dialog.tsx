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

interface ApplyForBmDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ApplyForBmDialog({ children, onSuccess }: ApplyForBmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { session } = useAuth()
  const { subscriptionData } = useSubscription()

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
    
    // Check subscription status first
    if (!subscriptionData?.canRequestAssets) {
      toast.error("Upgrade Required", {
        description: "Please subscribe to a plan to request business managers."
      })
      return
    }
    
    // Validate form
    const validation = validateBusinessManagerApplicationForm(formData)
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }
    
    setIsLoading(true)

    try {
      console.log('🏢 Submitting business manager application:', formData);
      
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          website_url: formData.website, // Fixed: send website_url instead of website
          type: 'business_manager',
        }),
      });

      const responseData = await response.json();
      console.log('🏢 Application response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit application');
      }

      setShowSuccess(true)
      toast.success("Application Submitted!", {
        description: "Your business manager application has been submitted for review."
      })

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
      console.error('🏢 Application submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error("Submission Failed", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground">
              Your business manager application has been submitted for review. We'll notify you once it's processed.
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
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
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

          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your application will be reviewed within 1-3 business days</li>
              <li>• Once approved, you'll receive your Business Manager ID</li>
              <li>• You can then start creating ad accounts and campaigns</li>
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
              disabled={isLoading || !formData.website}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
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