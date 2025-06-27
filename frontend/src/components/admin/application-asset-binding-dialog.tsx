"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSWRConfig } from "swr"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Loader2, AlertCircle, Building2, Users, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import { toast } from "sonner"
import { Badge } from "../ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import type { DolphinAsset } from "@/services/supabase-service"

interface Application {
  id: string
  organization_name: string
  business_id?: string
  business_name: string
  facebook_business_manager_id?: string
  facebook_business_manager_name?: string
}

interface ApplicationAssetBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: Application | null;
  onSuccess: () => void;
}

export function ApplicationAssetBindingDialog({
  open,
  onOpenChange,
  application,
  onSuccess,
}: ApplicationAssetBindingDialogProps) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<DolphinAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedAssets, setSelectedAssets] = useState<{
    business_manager?: string
    ad_accounts: string[]
  }>({
    ad_accounts: []
  })

  const { mutate } = useSWRConfig()

  const hasPredefinedBM = !!application?.facebook_business_manager_id;

  const loadAvailableAssets = useCallback(async () => {
    setLoadingAssets(true)
    try {
      const response = await fetch("/api/admin/dolphin-assets/all-assets?unbound_only=true")
      if (!response.ok) {
        throw new Error("Failed to fetch assets")
      }
      const data = await response.json()
      setAssets(data.assets || [])
    } catch (error) {
      console.error("Failed to load assets:", error)
      toast.error("Could not load available assets.")
    } finally {
      setLoadingAssets(false)
    }
  }, []);

  // Load available assets only when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableAssets()
    }
  }, [open, loadAvailableAssets])

  // Set the predefined Business Manager once assets are loaded
  useEffect(() => {
    if (open && hasPredefinedBM && assets.length > 0) {
      const predefinedBmAsset = assets.find(asset => asset.asset_id === application?.facebook_business_manager_id);
      if (predefinedBmAsset && selectedAssets.business_manager !== predefinedBmAsset.id) {
        setSelectedAssets(prev => ({ ...prev, business_manager: predefinedBmAsset.id }));
      }
    }
  }, [open, hasPredefinedBM, assets, application?.facebook_business_manager_id, selectedAssets.business_manager]);

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (!application?.id || !application?.business_id) {
        throw new Error("Application or Business ID is missing. Cannot proceed.")
      }

      const payload = {
        application_id: application.id,
        business_id: application.business_id,
        business_manager_id: selectedAssets.business_manager,
        ad_account_ids: selectedAssets.ad_accounts,
      };

      const response = await fetch('/api/admin/asset-bindings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fulfill application');
      }

      toast.success("Application fulfilled successfully!");
      mutate('/api/admin/applications');
      mutate('/api/businesses');
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Fulfillment error:", error)
      toast.error(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const businessManagers = Array.isArray(assets) ? assets.filter(asset => asset.asset_type === 'business_manager') : []
  const adAccounts = Array.isArray(assets) ? assets.filter(asset => asset.asset_type === 'ad_account') : []

  // Find the full asset object for the selected business manager
  const selectedBmAsset = useMemo(() => {
    if (hasPredefinedBM) {
      return assets.find(asset => asset.asset_id === application?.facebook_business_manager_id);
    }
    return businessManagers.find(asset => asset.id === selectedAssets.business_manager);
  }, [selectedAssets.business_manager, businessManagers, hasPredefinedBM, application?.facebook_business_manager_id, assets]);

  // Filter ad accounts based on the selected business manager
  const filteredAdAccounts = useMemo(() => {
    if (!selectedBmAsset) {
      // If no BM is selected (and none is predefined), show no ad accounts to prevent mismatch.
      return [];
    }
    return adAccounts.filter(acc => acc.parent_business_manager_id === selectedBmAsset.asset_id);
  }, [adAccounts, selectedBmAsset]);

  const toggleAdAccount = (assetId: string) => {
    setSelectedAssets(prev => ({
      ...prev,
      ad_accounts: prev.ad_accounts.includes(assetId)
        ? prev.ad_accounts.filter(id => id !== assetId)
        : [...prev.ad_accounts, assetId]
    }))
  }

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fulfill Application Request</DialogTitle>
          <DialogDescription>
            Assign available Dolphin assets to fulfill "{application.organization_name}"'s application and activate their account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Info */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-foreground" />
              <span className="font-medium text-foreground">Client Application</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Organization:</strong> {application.organization_name}</p>
              <p><strong>Business:</strong> {application.business_name}</p>
              <p className="text-xs mt-1">Ready for asset assignment and activation</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loadingAssets ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading available assets...</span>
            </div>
          ) : (
            <>
              {/* Asset Selection */}
              <div className="space-y-4">
                {/* Business Manager Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Business Manager {hasPredefinedBM ? "" : "(Optional)"}
                  </Label>
                  <Select
                    value={selectedAssets.business_manager || "none"}
                    onValueChange={(value) => setSelectedAssets(prev => ({ 
                      ...prev, 
                      business_manager: value === "none" ? undefined : value,
                      ad_accounts: [] // Reset ad accounts when BM changes
                    }))}
                    disabled={hasPredefinedBM}
                  >
                    <SelectTrigger>
                      {hasPredefinedBM ? (
                        <SelectValue placeholder={application.facebook_business_manager_name} />
                      ) : (
                        <SelectValue placeholder="Select a business manager to assign (optional)" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No business manager</SelectItem>
                      {businessManagers.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">{asset.asset_id}</div>
                            </div>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {asset.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {businessManagers.length === 0 && (
                    <p className="text-sm text-muted-foreground">No unassigned business managers available</p>
                  )}
                </div>

                {/* Ad Accounts Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Ad Accounts
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {filteredAdAccounts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {selectedBmAsset ? 'No unassigned ad accounts found for this BM.' : 'Select a Business Manager to see available ad accounts.'}
                      </p>
                    ) : (
                      filteredAdAccounts.map((asset) => (
                        <div key={asset.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                          <input
                            type="checkbox"
                            id={`account-${asset.id}`}
                            checked={selectedAssets.ad_accounts.includes(asset.id)}
                            onChange={() => toggleAdAccount(asset.id)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`account-${asset.id}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{asset.name}</div>
                                <div className="text-xs text-muted-foreground">{asset.asset_id}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {asset.status}
                              </Badge>
                            </div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedAssets.ad_accounts.length > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {selectedAssets.ad_accounts.length} ad account(s) selected for assignment
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || loadingAssets || (!selectedAssets.business_manager && selectedAssets.ad_accounts.length === 0)}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fulfill Application & Activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 