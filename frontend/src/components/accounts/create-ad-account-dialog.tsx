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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"
import { Check, Loader2, Building2 } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "../ui/states"
import { timezones } from "../../lib/timezones"
import { useOrganizationStore } from "../../lib/stores/organization-store"
import { useBusinessManagers } from "@/lib/swr-config"
import { useSWRConfig } from "swr"
import { useAuth } from "@/contexts/AuthContext"

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
  bmId?: string | null // Business Manager ID if we're on a specific BM page
  onAccountCreated?: () => void
}

export function CreateAdAccountDialog({ trigger, bmId, onAccountCreated }: CreateAdAccountDialogProps) {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { mutate } = useSWRConfig();

  // Fetch business managers with organization ID
  const { data: businessManagers, isLoading: areBusinessManagersLoading } = useBusinessManagers(currentOrganizationId);

  const approvedBusinessManagers = Array.isArray(businessManagers) ? businessManagers : [];

  // Find the specific BM if bmId is provided
  const selectedBM = bmId ? approvedBusinessManagers.find((bm: any) => bm.id === bmId) : null;

  const [formData, setFormData] = useState({
    business_manager_id: bmId || "",
    timezone: "UTC",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.business_manager_id) {
        toast.error("Please select a business manager.");
        return;
    }
    
    setIsLoading(true)

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          business_manager_id: formData.business_manager_id,
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

      // Revalidate the accounts data after creation
      mutate(['/api/ad-accounts', session?.access_token]);
      if (bmId) {
        mutate([`/api/ad-accounts?bm_id=${bmId}`, session?.access_token]);
      }

      setTimeout(() => {
        setFormData({ business_manager_id: bmId || "", timezone: "UTC" })
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
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] rounded-full flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">Request Submitted</h3>
                <p className="text-sm text-muted-foreground">Your ad account request has been submitted for review.</p>
            </div>
        )
    }

    if (!areBusinessManagersLoading && approvedBusinessManagers.length === 0) {
        return (
            <EmptyState
                icon={Building2}
                title="No Approved Business Managers"
                description="You need at least one approved business manager to create an ad account. Please apply for a business manager and wait for its approval."
            />
        )
    }

    return (
        <>
            <DialogHeader>
            <DialogTitle className="text-foreground">Request Ad Account</DialogTitle>
            <DialogDescription className="text-muted-foreground">
                {bmId && selectedBM 
                  ? `Request a new advertising account for ${selectedBM.name || selectedBM.metadata?.business_manager || 'this business manager'}.`
                  : "Request a new advertising account for one of your approved business managers."
                }
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Only show BM selector if not on a specific BM page */}
                {!bmId && (
                  <div className="space-y-2">
                      <Label htmlFor="business_manager" className="text-foreground">
                      Business Manager
                      </Label>
                      <Select
                      value={formData.business_manager_id}
                      onValueChange={(value) => setFormData({ ...formData, business_manager_id: value })}
                      required
                      disabled={areBusinessManagersLoading}
                      >
                      <SelectTrigger>
                          <SelectValue placeholder={areBusinessManagersLoading ? "Loading business managers..." : "Select a business manager"} />
                      </SelectTrigger>
                      <SelectContent>
                          {approvedBusinessManagers.map((bm: any) => (
                          <SelectItem key={bm.asset_id || bm.id} value={bm.id}>
                              {bm.name || bm.metadata?.business_manager || `BM ${bm.id}`}
                          </SelectItem>
                          ))}
                      </SelectContent>
                      </Select>
                  </div>
                )}

                {/* Show selected BM info if on specific BM page */}
                {bmId && selectedBM && (
                  <div className="space-y-2">
                    <Label className="text-foreground">Business Manager</Label>
                    <div className="p-3 bg-muted rounded-md border">
                      <div className="font-medium text-foreground">
                        {selectedBM.name || selectedBM.metadata?.business_manager || 'Business Manager'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {selectedBM.id}
                      </div>
                    </div>
                  </div>
                )}

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
      <DialogContent className={showSuccess ? "sm:max-w-md" : ""}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}