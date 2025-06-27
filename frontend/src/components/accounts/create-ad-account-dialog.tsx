"use client"

import type React from "react"
import { useState } from "react"
import useSWR, { useSWRConfig } from 'swr'
import { useOrganizationStore } from "@/lib/stores/organization-store"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Check, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "../ui/comprehensive-states"
import { timezones } from "../../lib/timezones"

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
  businessId?: string
  onAccountCreated?: () => void
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function CreateAdAccountDialog({ trigger, businessId, onAccountCreated }: CreateAdAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { currentOrganizationId } = useOrganizationStore();
  const { mutate } = useSWRConfig();

  const { data: businessesData, isLoading: areBusinessesLoading } = useSWR(
    // Fetch only active businesses suitable for new ad accounts
    currentOrganizationId ? `/api/businesses?organization_id=${currentOrganizationId}&status=active` : null,
    fetcher
  );
  const approvedBusinesses = businessesData?.businesses || [];

  const [formData, setFormData] = useState({
    business: businessId || "",
    timezone: "UTC",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.business) {
        toast.error("Please select a business.");
        return;
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: formData.business,
          timezone: formData.timezone,
          type: 'ad_account', // Specify the application type
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setShowSuccess(true)
      toast.success("Account Requested!", {
        description: "Your ad account application has been submitted for review."
      })

      // Revalidate the accounts table data after creation
      mutate(`/api/ad-accounts?organization_id=${currentOrganizationId}`);

      setTimeout(() => {
        setFormData({ business: businessId || "", timezone: "UTC" })
        setShowSuccess(false)
        setOpen(false)
        onAccountCreated?.()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error("Submission Failed", { description: errorMessage });
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Account Requested!</h3>
                <p className="text-muted-foreground">Your ad account request has been submitted and is under review.</p>
            </div>
        )
    }

    if (!areBusinessesLoading && approvedBusinesses.length === 0) {
        return (
            <EmptyState
                icon={Building2}
                title="No Approved Businesses"
                description="You need at least one approved business to create an ad account. Please create a business and wait for its approval."
            />
        )
    }

    return (
        <>
            <DialogHeader>
            <DialogTitle className="text-foreground">Request Ad Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
                Request a new advertising account for one of your approved businesses.
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
                    disabled={areBusinessesLoading}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder={areBusinessesLoading ? "Loading businesses..." : "Select a business"} />
                    </SelectTrigger>
                    <SelectContent>
                        {approvedBusinesses.map((business: any) => (
                        <SelectItem key={business.id} value={business.id}>
                            {business.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-foreground">
                    Timezone
                    </Label>
                    <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    required
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent className="h-64">
                        {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Request Account
                    </Button>
                </div>
            </form>
        </>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}