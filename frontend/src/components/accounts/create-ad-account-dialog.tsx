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
import { useSubscription } from "@/hooks/useSubscription"
import { PageSelector } from '@/components/pages/page-selector'
import { AccountTypeSelector, type AccountType } from '@/components/accounts/account-type-selector'
import { BmAttachmentSelector, type BmAttachmentType, type BmAttachmentData } from '@/components/business-managers/bm-attachment-selector'
import { isPremiumPlan } from '@/lib/config/pricing-config'

interface CreateAdAccountDialogProps {
  trigger: React.ReactNode
  bmId?: string | null // Business Manager ID if we're on a specific BM page
  onAccountCreated?: () => void
}

export function CreateAdAccountDialog({ trigger, bmId, onAccountCreated }: CreateAdAccountDialogProps) {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  const { usage, checkLimit, currentPlan } = useSubscription();
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { mutate } = useSWRConfig();

  // Fetch business managers with organization ID
  const { data: businessManagers, isLoading: areBusinessManagersLoading } = useBusinessManagers();

  // Filter out applications and only show approved/active business managers
  const approvedBusinessManagers = Array.isArray(businessManagers) 
    ? businessManagers.filter((bm: any) => !bm.is_application && bm.status === 'active')
    : [];

  // Find the specific BM if bmId is provided
  const selectedBM = bmId ? approvedBusinessManagers.find((bm: any) => bm.id === bmId) : null;

  // Check if user has reached ad account limit
  const canAddMoreAccounts = checkLimit('adAccounts', usage?.adAccounts || 0)
  const hasReachedAccountLimit = !canAddMoreAccounts

  // Check if current plan is Plus (has premium features)
  // Temporarily disabled while Plus plan is in "Contact Us" mode
  const isPlus = false // currentPlan ? isPremiumPlan(currentPlan.id as any) : false

  const [formData, setFormData] = useState({
    business_manager_id: bmId || "",
    timezone: "UTC",
    selectedPageIds: [] as string[],
    // Plus plan specific fields
    accountType: 'prepay' as AccountType, // Default to prepay for backwards compatibility
    bmAttachment: {
      type: 'request' as BmAttachmentType,
      bmId: '',
      bmName: '',
      justification: ''
    } as BmAttachmentData
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For non-Plus plans or prepay accounts, require BM selection
    if (!formData.business_manager_id && (!isPlus || formData.accountType === 'prepay')) {
        toast.error("Please select a business manager.");
        return;
    }

    // For post-pay accounts with own BM attachment, validate BM details
    if (isPlus && formData.accountType === 'postpay' && formData.bmAttachment.type === 'own') {
      if (!formData.bmAttachment.bmId || !formData.bmAttachment.bmName) {
        toast.error("Please provide Business Manager ID and name for attachment.");
        return;
      }
    }

    // Only require pages for prepay accounts (post-pay accounts might not have pages initially)
    if (formData.accountType === 'prepay' && formData.selectedPageIds.length === 0) {
      toast.error('At least one Facebook page is required for prepay accounts');
      return;
    }

    // Check ad account limit
    if (hasReachedAccountLimit) {
      toast.error("Plan Limit Reached", {
        description: "You have reached the maximum number of ad accounts for your current plan. Please upgrade to add more ad accounts.",
      });
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
          page_ids: formData.selectedPageIds, // Include selected Facebook pages
          // Plus plan specific fields (temporarily disabled)
          // ...(isPlus && {
          //   account_type: formData.accountType,
          //   bm_attachment: formData.accountType === 'postpay' ? formData.bmAttachment : null,
          // }),
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
        setFormData({ 
          business_manager_id: bmId || "", 
          timezone: "UTC", 
          selectedPageIds: [],
          accountType: 'prepay' as AccountType,
          bmAttachment: {
            type: 'request' as BmAttachmentType,
            bmId: '',
            bmName: '',
            justification: ''
          } as BmAttachmentData
        })
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
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Check className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Request Submitted</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Your ad account request has been submitted for review. You'll be notified once it's processed.
                </p>
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

                {/* Plus Plan Features - Account Type & BM Attachment */}
                {isPlus && (
                  <>
                    <AccountTypeSelector
                      selectedType={formData.accountType}
                      onTypeChange={(type) => setFormData(prev => ({ ...prev, accountType: type }))}
                      className="space-y-2"
                    />

                    {formData.accountType === 'postpay' && (
                      <BmAttachmentSelector
                        selectedData={formData.bmAttachment}
                        onDataChange={(data) => setFormData(prev => ({ ...prev, bmAttachment: data }))}
                        className="space-y-2"
                      />
                    )}
                  </>
                )}

                {/* Facebook Pages Selection - Only from this BM */}
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Select Facebook Pages from this Business Manager
                  </Label>
                  <PageSelector
                    selectedPageIds={formData.selectedPageIds}
                    onPageSelection={(pageIds) => setFormData(prev => ({ ...prev, selectedPageIds: pageIds }))}
                    maxPages={10} // Allow selecting multiple pages (up to BM's total limit)
                    required={true}
                    businessManagerId={formData.business_manager_id} // Filter pages by BM
                    showCreateOption={false} // Don't allow creating new pages
                  />
                  <p className="text-xs text-muted-foreground">
                    Select from pages already created for this Business Manager. To add more pages to this BM, contact support.
                  </p>
                </div>

                {hasReachedAccountLimit && (
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <h4 className="text-sm font-medium text-foreground mb-2">Plan Limit Reached</h4>
                    <p className="text-xs text-muted-foreground">
                      You have reached the maximum number of ad accounts for your current plan. Please upgrade to add more ad accounts.
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                    Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || hasReachedAccountLimit}
                      className="bg-primary text-black hover:opacity-90 disabled:opacity-50"
                    >
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