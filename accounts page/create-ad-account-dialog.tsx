"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MOCK_BUSINESSES } from "@/data/mock-businesses"
import { Building2, CreditCard, FileText } from "lucide-react"

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
}

export function CreateAdAccountDialog({ trigger }: CreateAdAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    accountName: "",
    business: "",
    platform: "",
    initialBalance: "",
    spendLimit: "",
    timezone: "",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setOpen(false)
    // Reset form
    setFormData({
      accountName: "",
      business: "",
      platform: "",
      initialBalance: "",
      spendLimit: "",
      timezone: "",
      notes: "",
    })
  }

  const platforms = [
    { value: "meta", label: "Meta (Facebook/Instagram)" },
    { value: "google", label: "Google Ads" },
    { value: "tiktok", label: "TikTok Ads" },
    { value: "linkedin", label: "LinkedIn Ads" },
  ]

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[#c4b5fd]" />
            Request New Ad Account
          </DialogTitle>
          <div className="text-sm text-muted-foreground">Submit a request for a new advertising account setup</div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Account Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accountName" className="text-sm font-medium text-foreground">
                  Account Name *
                </Label>
                <Input
                  id="accountName"
                  placeholder="e.g., Primary Campaign Account"
                  value={formData.accountName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountName: e.target.value }))}
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business" className="text-sm font-medium text-foreground">
                  Business *
                </Label>
                <Select
                  value={formData.business}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, business: value }))}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {MOCK_BUSINESSES.map((business) => (
                      <SelectItem
                        key={business.id}
                        value={business.name}
                        className="text-popover-foreground hover:bg-accent"
                      >
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform" className="text-sm font-medium text-foreground">
                  Platform *
                </Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, platform: value }))}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {platforms.map((platform) => (
                      <SelectItem
                        key={platform.value}
                        value={platform.value}
                        className="text-popover-foreground hover:bg-accent"
                      >
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium text-foreground">
                  Timezone *
                </Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {timezones.map((timezone) => (
                      <SelectItem
                        key={timezone.value}
                        value={timezone.value}
                        className="text-popover-foreground hover:bg-accent"
                      >
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Financial Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Budget Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialBalance" className="text-sm font-medium text-foreground">
                  Initial Balance
                </Label>
                <Input
                  id="initialBalance"
                  type="number"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData((prev) => ({ ...prev, initialBalance: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spendLimit" className="text-sm font-medium text-foreground">
                  Monthly Spend Limit
                </Label>
                <Input
                  id="spendLimit"
                  type="number"
                  placeholder="0.00"
                  value={formData.spendLimit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, spendLimit: e.target.value }))}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Additional Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Additional Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium text-foreground">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional requirements or notes for the account setup..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="bg-background border-border text-foreground min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !formData.accountName || !formData.business || !formData.platform || !formData.timezone
              }
              className="flex-1 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {isLoading ? "Submitting Request..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
