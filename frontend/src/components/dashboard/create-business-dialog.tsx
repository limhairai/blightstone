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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, Loader2, Building2 } from "lucide-react"
import { layout } from "@/lib/layout-utils"
import { contentTokens } from "@/lib/content-tokens"
import { useDemoState } from "@/contexts/DemoStateContext"
import { cn } from "@/lib/utils"

interface CreateBusinessDialogProps {
  trigger: React.ReactNode
  onBusinessCreated?: () => void
}

export function CreateBusinessDialog({ trigger, onBusinessCreated }: CreateBusinessDialogProps) {
  const { createBusiness, state } = useDemoState()
  const [open, setOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
  })
  const [urlError, setUrlError] = useState("")

  const industries = [
    "Technology",
    "Marketing",
    "E-commerce",
    "Healthcare",
    "Finance",
    "Education",
    "Real Estate",
    "Food & Beverage",
    "Fashion",
    "Travel",
    "Other",
  ]

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

    // Validate URL before submission
    if (formData.website && !validateUrl(formData.website)) {
      setUrlError("Please enter a valid website URL")
      return
    }

    try {
      // Use demo state management to create business
      await createBusiness({
        name: formData.name,
        industry: formData.industry,
        website: formData.website ? normalizeUrl(formData.website) : undefined,
        description: formData.description || undefined,
        status: 'pending', // New businesses start as pending
        monthlyQuota: 10000, // Default quota
      })

      setShowSuccess(true)
      setTimeout(() => {
        setFormData({
          name: "",
          industry: "",
          website: "",
          description: "",
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
        <form onSubmit={handleSubmit} className={layout.formGroups}>
          <div className={layout.stackSmall}>
            <Label htmlFor="name" className="text-foreground">
              Business Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={contentTokens.placeholders.name}
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className={layout.stackSmall}>
            <Label htmlFor="industry" className="text-foreground">
              Industry *
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
              required
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry} className="text-popover-foreground hover:bg-accent">
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className={layout.stackSmall}>
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

          <div className={layout.stackSmall}>
            <Label htmlFor="description" className="text-foreground">
              {contentTokens.labels.description}
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={contentTokens.placeholders.description}
              className="min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            />
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
              disabled={state.loading.businesses}
              className="border-border text-foreground hover:bg-accent"
            >
              {contentTokens.actions.cancel}
            </Button>
            <Button
              type="submit"
              disabled={state.loading.businesses}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {state.loading.businesses ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {contentTokens.loading.processing}
                </>
              ) : (
                contentTokens.actions.create
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
