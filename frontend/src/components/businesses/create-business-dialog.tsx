"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Loader2, Building2 } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CreateBusinessDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onBusinessCreated?: () => void
  onSuccess?: () => void
}

export function CreateBusinessDialog({ 
  trigger, 
  children,
  open: controlledOpen,
  onOpenChange,
  onBusinessCreated, 
  onSuccess 
}: CreateBusinessDialogProps) {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const isSubmitDisabled = isSubmitting || !currentOrganizationId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSubmitting(true)

    if (!name) {
      toast.error("Business name is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!currentOrganizationId) {
        throw new Error('No organization is currently selected. Please select an organization and try again.');
      }

      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          name: name,
          website: website,
          organization_id: currentOrganizationId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit business application')
      }

      toast.success("Application Submitted!", {
        description: "Your business application has been submitted for review.",
      })
      
      setOpen(false)
      setName("")
      setWebsite("")
      onBusinessCreated?.()
      onSuccess?.()

    } catch (error) {
      console.error('Failed to create business:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create business application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Apply for Business
          </DialogTitle>
          <DialogDescription>
            Submit an application to create a new business profile for advertising.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Acme Inc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., acme.com"
            />
             <p className="text-xs text-muted-foreground">
              Enter your website URL in any format: domain.com, www.domain.com, or https://domain.com
            </p>
          </div>
          
          <div className="space-y-2">
             <p className="text-xs text-muted-foreground">
              Note: All business applications are reviewed manually. You'll receive an email notification once your application is approved or if additional information is needed.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button 
                      type="submit" 
                      disabled={isSubmitDisabled}
                      className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0 disabled:cursor-not-allowed"
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </TooltipTrigger>
                {!currentOrganizationId && (
                  <TooltipContent>
                    <p>You must create or select an organization first.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}