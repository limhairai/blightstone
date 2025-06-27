"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSWRConfig } from 'swr'
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
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { useToast } from "../../hooks/use-toast"
import { Check, Loader2, Building2, Upload, X, Plus } from "lucide-react"
import { Business } from "@/types/business"
import { Badge } from "../ui/badge"
import { toast } from "sonner"
import { getInitials } from "../../lib/utils"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { useTheme } from "next-themes"
import { getPlaceholderUrl } from '@/lib/config/assets'
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface EditBusinessDialogProps {
  business: Business
  trigger: React.ReactNode
  onBusinessUpdated?: (updatedBusiness: Business) => void
}

export function EditBusinessDialog({ business, trigger, onBusinessUpdated }: EditBusinessDialogProps) {
  const { theme } = useTheme()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore();
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: business.name,
    industry: "", // business_type was removed from database
    website: business.website_url || "",
    description: business.landing_page || "", 
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
        industry: "", // business_type field was removed
        website: business.website_url || "",
        description: business.landing_page || "",
        logo: null,
        logoPreview: "",
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
    setIsProcessing(true);

    try {
      const updatedBusinessData = {
        name: formData.name,
        website_url: formData.website || undefined,
        description: formData.description || undefined,
      };

      const response = await fetch(`/api/businesses?id=${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBusinessData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update business");
      }

      const updatedBusiness = await response.json();

      mutate(`/api/businesses?organization_id=${currentOrganizationId}`);
      
      setShowSuccess(true)

      onBusinessUpdated?.(updatedBusiness);

      // Close dialog after success
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast.error("Failed to update business", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  }

  const isLoading = isProcessing;

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
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
                      src={formData.logoPreview || "getPlaceholderUrl()"}
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
              {(business as any).domains?.map((domain: any, index: number) => (
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
          {(business as any).bmId && (
            <div className="space-y-2">
              <Label htmlFor="bmId" className="text-foreground">
                Business Manager ID
              </Label>
              <Input
                id="bmId"
                value={(business as any).bmId}
                readOnly
                className="bg-muted border-border text-foreground font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Business Manager ID cannot be changed. Contact support if you need assistance.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
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
              disabled={isLoading}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
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
