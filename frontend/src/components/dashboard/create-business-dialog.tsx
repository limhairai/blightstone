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
import { toast } from "sonner"

interface CreateBusinessDialogProps {
  trigger: React.ReactNode
  onBusinessCreated?: () => void
}

export function CreateBusinessDialog({ trigger, onBusinessCreated }: CreateBusinessDialogProps) {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")

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
      const orgsResponse = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!orgsResponse.ok) throw new Error('Failed to fetch user organizations');
      
      const orgsData = await orgsResponse.json();
      const organizationId = orgsData.organizations?.[0]?.id;
      
      if (!organizationId) throw new Error('No organization found for user.');

      const response = await fetch('/api/bm-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          website_url: website,
          organization_id: organizationId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit business application')
      }

      toast.success("Application Submitted!", { description: "Your business application has been submitted for review." })
      
      setOpen(false)
      onBusinessCreated?.()

    } catch (error) {
      console.error('Failed to create business:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create business application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
