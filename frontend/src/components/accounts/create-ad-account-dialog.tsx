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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Check, Loader2 } from "lucide-react"
import { useDemoState } from "../../contexts/DemoStateContext"
import { toast } from "sonner"

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
  businessId?: string
  onAccountCreated?: () => void
}

export function CreateAdAccountDialog({ trigger, businessId, onAccountCreated }: CreateAdAccountDialogProps) {
  const { state, createAccount } = useDemoState()
  const [open, setOpen] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    business: businessId || "",
    spendLimit: 1000,
    quota: 5000,
  })

  // Only show approved businesses
  const approvedBusinesses = state.businesses.filter(business => business.status === 'active')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Please enter an account name")
      return
    }

    if (!formData.business) {
      toast.error("Please select a business")
      return
    }

    try {
      // Generate realistic account data
      const accountData = {
        name: formData.name.trim(),
        business: approvedBusinesses.find(b => b.id === formData.business)?.name || "",
        adAccount: `act_${Math.random().toString().slice(2, 17)}`, // Generate realistic ad account ID
        balance: 0, // New accounts start with $0
        status: "pending" as const, // New accounts start as pending
        platform: "Meta" as const,
        timezone: "America/New_York",
        spendLimit: formData.spendLimit,
        quota: formData.quota,
        spent: 0, // New accounts start with $0 spent
      }

      await createAccount(accountData)
      
      setShowSuccess(true)

      // Reset form and close dialog after success animation
      setTimeout(() => {
        setFormData({
          name: "",
          business: businessId || "",
          spendLimit: 1000,
          quota: 5000,
        })
        setShowSuccess(false)
        setOpen(false)

        if (onAccountCreated) {
          onAccountCreated()
        }
      }, 2000)
    } catch (error) {
      // Error handling is done in the createAccount function
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Account Requested!</h3>
            <p className="text-muted-foreground">Your ad account request has been submitted and is under review.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Request Ad Account</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Request a new advertising account for your business. This will be submitted for review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Account Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter account name (e.g., 'Main Campaign Account')"
              required
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business" className="text-foreground">
              Business *
            </Label>
            {approvedBusinesses.length > 0 ? (
              <Select
                value={formData.business}
                onValueChange={(value) => setFormData({ ...formData, business: value })}
                required
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {approvedBusinesses.map((business) => (
                    <SelectItem key={business.id} value={business.id} className="text-popover-foreground hover:bg-accent">
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted/50 border border-border rounded-md">
                <p className="text-sm text-muted-foreground">
                  No approved businesses available. You need to have an approved business before requesting ad accounts.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Apply for a business first and wait for approval.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Platform</Label>
            <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50 border-border">
              <span className="text-sm font-medium text-foreground">Meta (Facebook & Instagram)</span>
            </div>
            <p className="text-xs text-muted-foreground">More platforms coming soon</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={state.loading.accounts}
              className="border-border text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={state.loading.accounts || approvedBusinesses.length === 0}
              className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
            >
              {state.loading.accounts ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 