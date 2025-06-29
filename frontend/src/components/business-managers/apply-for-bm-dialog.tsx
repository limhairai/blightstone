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
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface ApplyForBmDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ApplyForBmDialog({ children, onSuccess }: ApplyForBmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()
  const { session } = useAuth()

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
    setIsLoading(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          website: formData.website,
          type: 'business_manager',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setShowSuccess(true)
      toast({
        title: "Application Submitted!",
        description: "Your business manager application has been submitted for review.",
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
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
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
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://your-website.com"
              required
              className="bg-background border-border text-foreground"
            />
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