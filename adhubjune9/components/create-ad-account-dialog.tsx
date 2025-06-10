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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2 } from "lucide-react"

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
  businessId?: string
  onAccountCreated?: () => void
}

export function CreateAdAccountDialog({ trigger, businessId, onAccountCreated }: CreateAdAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    business: businessId || "",
  })

  const businesses = [
    { id: "1", name: "TechFlow Solutions", status: "active" },
    { id: "2", name: "Digital Marketing Co", status: "active" },
    { id: "3", name: "StartupHub Inc", status: "pending" },
  ]

  const approvedBusinesses = businesses.filter((b) => b.status === "active")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setShowSuccess(true)
      toast({
        title: "Ad Account Created!",
        description: "Your ad account has been submitted for review.",
      })

      // Reset form after success
      setTimeout(() => {
        setFormData({
          business: businessId || "",
        })
        setShowSuccess(false)
        setOpen(false)

        if (onAccountCreated) {
          onAccountCreated()
        }
      }, 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ad account. Please try again.",
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
            <Label htmlFor="business" className="text-foreground">
              Business
            </Label>
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
                  Requesting...
                </>
              ) : (
                "Request Account"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
