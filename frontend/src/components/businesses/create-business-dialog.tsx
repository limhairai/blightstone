"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Check, Loader2, Building2, CheckCircle } from "lucide-react"
import { useAppData } from "../../contexts/AppDataContext"
import { useAuth } from "../../contexts/AuthContext"
import { cn } from "../../lib/utils"
import { FormFieldState, LoadingState } from "../ui/comprehensive-states"
import { validateForm, validators, showValidationErrors, showSuccessToast } from "../../lib/form-validation"

interface CreateBusinessDialogProps {
  trigger: React.ReactNode
  onBusinessCreated?: () => void
}

export function CreateBusinessDialog({ trigger, onBusinessCreated }: CreateBusinessDialogProps) {
  const { createBusiness, state } = useAppData()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [urlError, setUrlError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    website: "",
  })

  const validateUrl = (url: string): boolean => {
    if (!url) return true // Optional field
    
    // Allow various URL formats
    const urlPatterns = [
      /^https?:\/\/.+\..+/, // Full URL with protocol
      /^www\..+\..+/, // www.domain.com
      /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/, // domain.com
    ]
    
    return urlPatterns.some(pattern => pattern.test(url))
  }

  const normalizeUrl = (url: string): string => {
    if (!url) return ""
    
    // If it's just a domain, add https://
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(url)) {
      return `https://${url}`
    }
    
    // If it starts with www, add https://
    if (url.startsWith('www.')) {
      return `https://${url}`
    }
    
    // If it already has protocol, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Default case
    return url
  }

  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, website: value })
    
    if (value && !validateUrl(value)) {
      setUrlError("Please enter a valid website URL (e.g., example.com, www.example.com, or https://example.com)")
    } else {
      setUrlError("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Comprehensive form validation
    const validation = validateForm([
      () => validators.required(formData.name, 'Business name'),
      () => validators.minLength(formData.name, 2, 'Business name'),
      () => validators.maxLength(formData.name, 100, 'Business name'),
      () => formData.website ? validators.url(formData.website, 'Website') : null,
    ])
    
    if (!validation.isValid) {
      showValidationErrors(validation.errors)
      return
    }

    setLoading(true)
    try {
      // Call the real business creation API
      const organizationId = state.currentOrganization?.id || 'default-org-id';
      const response = await fetch(`/api/businesses?organization_id=${organizationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          website: formData.website ? normalizeUrl(formData.website) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to submit business application')
      }

      const result = await response.json()
      console.log('Business application submitted:', result)

      showSuccessToast("Business application submitted successfully!")
      setShowSuccess(true)

      // Reset form and close dialog after success
      setTimeout(() => {
        setFormData({
          name: "",
          website: "",
        })
        setUrlError("")
        setShowSuccess(false)
        setOpen(false)

        if (onBusinessCreated) {
          onBusinessCreated()
        }
      }, 2000)
    } catch (error) {
      console.error('Failed to create business:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit application'
      showValidationErrors([{ field: 'general', message: errorMessage }])
    } finally {
      setLoading(false)
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground">
              Your business application has been submitted and is under review. You&apos;ll be notified once approved.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
            Apply for Business
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit an application to create a new business profile for advertising.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Business Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your business name"
              required
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-foreground">
              Website
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={handleWebsiteChange}
              placeholder="example.com, www.example.com, or https://example.com"
              className={cn(
                "bg-background border-border text-foreground",
                urlError && "border-destructive"
              )}
            />
            {urlError && (
              <p className="text-xs text-destructive">{urlError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your website URL in any format: domain.com, www.domain.com, or https://domain.com
            </p>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> All business applications are reviewed manually. You&apos;ll receive an email
              notification once your application is approved or if additional information is needed.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {loading ? (
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