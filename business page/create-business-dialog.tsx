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
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Building2, Upload, X } from "lucide-react"

interface CreateBusinessDialogProps {
  trigger: React.ReactNode
  onBusinessCreated?: (business: any) => void
}

export function CreateBusinessDialog({ trigger, onBusinessCreated }: CreateBusinessDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
    logo: null as File | null,
    logoPreview: "",
  })

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

  const resetForm = () => {
    setFormData({
      name: "",
      industry: "",
      website: "",
      description: "",
      logo: null,
      logoPreview: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create new business object
      const newBusiness = {
        id: Date.now().toString(),
        name: formData.name,
        industry: formData.industry,
        website: formData.website || undefined,
        description: formData.description || undefined,
        logo: formData.logoPreview || undefined,
        status: "pending",
        dateCreated: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        accountsCount: 0,
        totalBalance: 0,
        totalSpend: 0,
        monthlyQuota: 5000,
        domains: [],
      }

      setShowSuccess(true)
      toast({
        title: "Application Submitted!",
        description: "Your business application has been submitted for review.",
      })

      // Call the callback with new business
      if (onBusinessCreated) {
        onBusinessCreated(newBusiness)
      }

      // Close dialog after success
      setTimeout(() => {
        setShowSuccess(false)
        setOpen(false)
        resetForm()
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit business application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
              Your business application has been submitted for review. We'll notify you once it's processed.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#c4b5fd]" />
            Apply for Business
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Submit your business information for review and approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-foreground">Business Logo (Optional)</Label>
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
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                  </span>
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
              placeholder="Brief description of your business and what you do..."
              rows={3}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="text-sm font-medium text-foreground mb-2">What happens next?</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Your application will be reviewed within 1-2 business days</li>
              <li>• We may request additional documentation</li>
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
              disabled={isLoading || !formData.name || !formData.industry}
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
