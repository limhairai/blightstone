"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { useToast } from "../../hooks/use-toast"
import { Check, Loader2, Building2, Upload, X, Plus } from "lucide-react"
import type { Business } from "../../types/business"
import { Badge } from "../ui/badge"
import { toast } from "sonner"
import { getInitials, type MockBusiness } from "../../lib/mock-data"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { useDemoState } from "../../contexts/DemoStateContext"
import { useTheme } from "next-themes"

interface EditBusinessDialogProps {
  business: MockBusiness
  trigger: React.ReactNode
  onBusinessUpdated?: (updatedBusiness: MockBusiness) => void
}

export function EditBusinessDialog({ business, trigger, onBusinessUpdated }: EditBusinessDialogProps) {
  const { state, updateBusiness } = useDemoState()
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: business.name,
    industry: business.industry,
    website: business.website || "",
    description: business.description || "",
    logo: null as File | null,
    logoPreview: "",
  })

  // Determine the current theme mode for avatar classes
  const currentMode = theme === "light" ? "light" : "dark"

  // Initialize form data when business changes or dialog opens
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        industry: business.industry,
        website: business.website || "",
        description: business.description || "",
        logo: null,
        logoPreview: business.logo || "",
      })
    }
  }, [business, open])

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        logo: file,
        logoPreview: URL.createObjectURL(file),
      })
    }
  }

  const clearLogoPreview = () => {
    setFormData({
      ...formData,
      logo: null,
      logoPreview: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create updated business object
      const updatedBusiness: MockBusiness = {
        ...business,
        name: formData.name,
        industry: formData.industry,
        website: formData.website || undefined,
        description: formData.description || undefined,
        logo: formData.logoPreview || undefined,
      }

      // Use demo state management to update business
      await updateBusiness(updatedBusiness)

      setShowSuccess(true)

      // Call the callback with updated business
      if (onBusinessUpdated) {
        onBusinessUpdated(updatedBusiness)
      }

      // Close dialog after success
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      })
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Business Updated!</h3>
            <p className="text-muted-foreground">Your business information has been updated successfully.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        // Prevent the business card click when dialog closes
        if (!newOpen) {
          setTimeout(() => {
            // Small delay to ensure the click event doesn't propagate
          }, 0)
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
            Edit Business
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your business information and profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">Business Logo</Label>
            <div className="flex items-center gap-4">
              {formData.logoPreview ? (
                <div className="relative">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
                    <img
                      src={formData.logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearLogoPreview}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className={getBusinessAvatarClasses('lg', currentMode)}>
                  <span>{getInitials(business.name)}</span>
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-2 border border-dashed border-border rounded-md hover:bg-accent/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload logo</span>
                  </div>
                  <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Recommended: Square image, at least 200x200px</p>
              </div>
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="website" className="text-foreground">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://your-website.com"
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Business Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your business..."
              rows={3}
              className="bg-background border-border text-foreground"
            />
          </div>

          {/* Domain Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Verified Domains</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Add domain functionality
                  const newDomain = prompt("Enter domain name (e.g., example.com):")
                  if (newDomain) {
                    toast({
                      title: "Domain Added",
                      description: `${newDomain} has been added for verification.`,
                    })
                  }
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Domain
              </Button>
            </div>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {business.domains?.map((domain, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${domain.verified ? "bg-emerald-500" : "bg-yellow-500"}`}
                    ></div>
                    <span className="text-sm text-foreground">{domain.domain}</span>
                    {domain.verified ? (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-700 text-xs">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-700 text-xs">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!domain.verified && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => {
                          toast({
                            title: "Verification initiated",
                            description: `Verification instructions for ${domain.domain} have been sent.`,
                          })
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-red-400 hover:text-red-500"
                      onClick={() => {
                        toast({
                          title: "Domain removed",
                          description: `${domain.domain} has been removed.`,
                        })
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )) || <p className="text-xs text-muted-foreground italic">No domains added yet</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              Verify domain ownership to enable advanced advertising features and build trust.
            </p>
          </div>

          {/* BM ID (read-only) */}
          {business.bmId && (
            <div className="space-y-2">
              <Label htmlFor="bmId" className="text-foreground">
                Business Manager ID
              </Label>
              <Input
                id="bmId"
                value={business.bmId}
                readOnly
                className="bg-muted border-border text-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Business Manager ID cannot be changed. Contact support if you need assistance.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={state.loading.businesses}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={state.loading.businesses}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {state.loading.businesses ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
