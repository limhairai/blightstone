"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Building2, CreditCard, AlertCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { DolphinAsset } from "@/services/supabase-service"
import useSWR from 'swr'

interface Organization {
  id: string;
  name: string;
}

interface BusinessManager {
  id: string;
  name: string;
  status: string;
  dolphin_id: string;
}

interface BindAssetDialogProps {
  asset: DolphinAsset
  onSuccess: () => void
}

// Authenticated fetcher for API calls
const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

export function BindAssetDialog({ asset, onSuccess }: BindAssetDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [selectedBusinessManagerId, setSelectedBusinessManagerId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoBindRelated, setAutoBindRelated] = useState(true)

  const isBusinessManager = asset.type === 'business_manager'
  const isAdAccount = asset.type === 'ad_account'

  // Get authentication token
  const { session } = useAuth()

  // Fetch organizations with authentication
  const { data: orgData, error: orgError } = useSWR<any>(
    session?.access_token ? ['/api/organizations', session.access_token] : null,
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );
  const organizations = orgData?.organizations;

  // Fetch all assets to determine relationships
  const { data: allAssetsData } = useSWR<any>(
    session?.access_token ? ['/api/admin/dolphin-assets/all-assets', session.access_token] : null,
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );
  const allAssets = allAssetsData?.assets || [];

  // For ad accounts, find which BMs they can be assigned to
  const compatibleBusinessManagers = useMemo(() => {
    if (!isAdAccount || !allAssets.length) return [];
    
    // Find the BM that this ad account belongs to based on metadata
    const adAccountBmId = asset.metadata?.business_manager_id;
    if (!adAccountBmId) return [];

    // Find the BM asset with this dolphin_id
    const compatibleBM = allAssets.find((a: DolphinAsset) => 
      a.type === 'business_manager' && 
      a.dolphin_id === adAccountBmId
    );

    return compatibleBM ? [compatibleBM] : [];
  }, [isAdAccount, allAssets, asset]);

  // For BMs, find related ad accounts
  const relatedAdAccounts = useMemo(() => {
    if (!isBusinessManager || !allAssets.length) return [];
    
    return allAssets.filter((a: DolphinAsset) => 
      a.type === 'ad_account' && 
      a.metadata?.business_manager_id === asset.dolphin_id &&
      !a.is_bound // Only show unbound ad accounts
    );
  }, [isBusinessManager, allAssets, asset]);

  // Fetch business managers for the selected organization (for ad account binding)
  const { data: bmData, error: bmError, isLoading: isBmLoading } = useSWR<any>(
    selectedOrgId && isAdAccount && session?.access_token ? 
      [`/api/admin/organizations/${selectedOrgId}/business-managers`, session.access_token] : null,
    ([url, token]) => fetcher(url, token),
    { revalidateOnFocus: false }
  );

  // Filter business managers to only show compatible ones for ad accounts
  const availableBusinessManagers = useMemo(() => {
    if (!isAdAccount) return [];
    
    const orgBMs = bmData?.business_managers || [];
    
    // Only show BMs that this ad account can be assigned to
    return orgBMs.filter((bm: BusinessManager) => 
      compatibleBusinessManagers.some(compatibleBM => 
        compatibleBM.dolphin_id === bm.dolphin_id
      )
    );
  }, [isAdAccount, bmData, compatibleBusinessManagers]);

  // Reset business manager selection when org changes
  useEffect(() => {
    setSelectedBusinessManagerId(null);
  }, [selectedOrgId]);

  const handleBind = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization')
      return
    }

    if (isAdAccount && !selectedBusinessManagerId) {
      toast.error('Please select a business manager for ad account binding')
      return
    }

    setIsSubmitting(true)
    
    try {
      const payload = {
        asset_id: asset.id,
        organization_id: selectedOrgId,
        bm_id: selectedBusinessManagerId || null,
        notes: `Manually bound ${isBusinessManager ? 'Business Manager' : 'Ad Account'} via admin panel`
      }

      // For Business Managers, use the auto-bind endpoint if requested
      const endpoint = isBusinessManager && autoBindRelated 
        ? '/api/admin/dolphin-assets/bind?auto_bind_related=true'
        : '/api/admin/dolphin-assets/bind';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.error || 'Failed to bind asset')
      }

      const result = await response.json()

      if (isBusinessManager && autoBindRelated) {
        toast.success(`Business Manager bound successfully! ${result.auto_bound_count || 0} related ad accounts were also bound.`)
      } else {
        toast.success(`${isBusinessManager ? 'Business Manager' : 'Ad Account'} bound successfully!`)
      }
      
      if (onSuccess) {
        await onSuccess()
      }
      
      setOpen(false)
      
    } catch (error) {
      console.error('Binding error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to bind asset')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDialogDescription = () => {
    if (isBusinessManager) {
      return "Assign this Business Manager to a client organization. You can optionally auto-bind all related ad accounts."
    } else {
      return "Assign this Ad Account to a Business Manager within a client organization. Ad accounts can only be assigned to their parent Business Manager."
    }
  }

  const getValidationMessage = () => {
    if (isAdAccount && compatibleBusinessManagers.length === 0) {
      return "This ad account cannot be bound because its parent Business Manager was not found or is not available."
    }
    
    if (isAdAccount && selectedOrgId && availableBusinessManagers.length === 0) {
      return "This ad account cannot be bound to the selected organization because the required Business Manager is not assigned to it."
    }
    
    return null;
  }

  const validationMessage = getValidationMessage();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
          Bind
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBusinessManager ? <Building2 className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
            Bind {isBusinessManager ? 'Business Manager' : 'Ad Account'}: {asset.name}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* Validation Alert */}
          {validationMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationMessage}</AlertDescription>
            </Alert>
          )}

          {/* Organization Selection */}
          <div className="space-y-2">
            <Label htmlFor="org-select">Organization</Label>
            <Select onValueChange={setSelectedOrgId} disabled={!organizations || !!validationMessage}>
              <SelectTrigger id="org-select">
                <SelectValue placeholder="Select an organization..." />
              </SelectTrigger>
              <SelectContent>
                {orgError && <SelectItem value="error" disabled>Error loading organizations</SelectItem>}
                {!organizations && !orgError && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                {organizations?.map((org: Organization) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Business Manager Selection (only for ad accounts) */}
          {isAdAccount && selectedOrgId && (
            <div className="space-y-2">
              <Label htmlFor="bm-select">Business Manager</Label>
              <Select onValueChange={setSelectedBusinessManagerId} disabled={availableBusinessManagers.length === 0 && !isBmLoading}>
                <SelectTrigger id="bm-select">
                  <SelectValue placeholder="Select a business manager..." />
                </SelectTrigger>
                <SelectContent>
                  {bmError && <SelectItem value="error" disabled>Error loading business managers</SelectItem>}
                  {isBmLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                  {!isBmLoading && availableBusinessManagers?.map((bm: BusinessManager) => (
                    <SelectItem key={bm.id} value={bm.id}>
                      {bm.name}
                    </SelectItem>
                  ))}
                  {!isBmLoading && availableBusinessManagers?.length === 0 && (
                    <SelectItem value="empty" disabled>
                      {bmData?.business_managers?.length === 0 
                        ? "No business managers found for this organization."
                        : "The required Business Manager is not assigned to this organization."}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {isAdAccount && compatibleBusinessManagers.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  This ad account can only be assigned to: <strong>{compatibleBusinessManagers[0].name}</strong>
                </div>
              )}
            </div>
          )}

          {/* Auto-bind option for Business Managers */}
          {isBusinessManager && relatedAdAccounts.length > 0 && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/40">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-bind" 
                  checked={autoBindRelated} 
                  onCheckedChange={setAutoBindRelated}
                />
                <Label htmlFor="auto-bind" className="text-sm font-medium">
                  Auto-bind related ad accounts ({relatedAdAccounts.length})
                </Label>
              </div>
              
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Related Ad Accounts:</span>
                </div>
                <div className="grid gap-1 ml-6">
                  {relatedAdAccounts.slice(0, 5).map((account: DolphinAsset) => (
                    <div key={account.id} className="text-xs">
                      • {account.name} ({account.dolphin_id})
                    </div>
                  ))}
                  {relatedAdAccounts.length > 5 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      ... and {relatedAdAccounts.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Asset Info Display */}
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="text-sm space-y-1">
              <p><strong>Asset Type:</strong> {isBusinessManager ? 'Business Manager' : 'Ad Account'}</p>
              <p><strong>Asset ID:</strong> {asset.dolphin_id}</p>
              <p><strong>Status:</strong> {asset.status}</p>
              {isAdAccount && asset.metadata?.business_manager_id && (
                <p><strong>Parent BM:</strong> {asset.metadata.business_manager_id}</p>
              )}
              {isBusinessManager && relatedAdAccounts.length > 0 && (
                <p><strong>Related Ad Accounts:</strong> {relatedAdAccounts.length} unbound accounts</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleBind} 
            disabled={isSubmitting || !selectedOrgId || (isAdAccount && !selectedBusinessManagerId) || !!validationMessage}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isBusinessManager ? 'Bind Business Manager' : 'Bind Ad Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}