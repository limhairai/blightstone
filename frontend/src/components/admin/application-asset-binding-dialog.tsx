"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSWRConfig } from "swr"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Loader2, AlertCircle, Building2, Users, CheckCircle, Search, Plus } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"
import { toast } from "sonner"
import { Badge } from "../ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import type { DolphinAsset } from "@/services/supabase-service"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Application } from "@/types/generated/semantic-ids"

type RequestMode = 'new-bm' | 'additional-accounts-specific' | 'additional-accounts-general'

// Extended Application interface for this component's needs
interface ApplicationWithDetails extends Application {
  organization_name: string
  business_name: string
  target_bm_id?: string
}

interface BusinessManager {
  id: string
  name: string
  asset_id: string
  current_account_count: number
}

// Union type for business manager objects from different sources
type BusinessManagerUnion = BusinessManager | DolphinAsset | {
  id: string;
  name: string;
  asset_id: string;
  status: string;
  type: string;
  dolphin_id?: string;
}

interface ApplicationAssetBindingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ApplicationWithDetails | null;
  mode: RequestMode;
  targetBmId?: string; // For specific BM requests
  existingBMs?: BusinessManager[]; // For general additional requests
  onSuccess: () => void;
}

export function ApplicationAssetBindingDialog({
  open,
  onOpenChange,
  application,
  mode,
  targetBmId,
  existingBMs = [],
  onSuccess,
}: ApplicationAssetBindingDialogProps) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<DolphinAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [selectedBusinessManager, setSelectedBusinessManager] = useState<string | null>(null)
  const [selectedAdAccounts, setSelectedAdAccounts] = useState<string[]>([])

  const { mutate } = useSWRConfig()

  const loadAvailableAssets = useCallback(async () => {
    setLoadingAssets(true)
    setError(null)
    try {
      // For new BM requests, get unbound business managers
      if (mode === 'new-bm') {
        const response = await fetch("/api/admin/unbound-assets?type=business_manager")
        if (!response.ok) {
          throw new Error("Failed to fetch available business managers")
        }
        const bmData = await response.json()
        
        // Also get unbound ad accounts for each BM
        const adResponse = await fetch("/api/admin/unbound-assets?type=ad_account")
        if (!adResponse.ok) {
          throw new Error("Failed to fetch available ad accounts")
        }
        const adData = await adResponse.json()
        
        // Transform the data to match expected format
        const transformedBMs = bmData.map((asset: any) => ({
          id: asset.asset_id || asset.id || asset.dolphin_id,
          asset_id: asset.asset_id || asset.id,
          dolphin_id: asset.dolphin_id,
          name: asset.name,
          type: asset.type,
          status: asset.status,
          metadata: asset.metadata
        }))
        
        const transformedAds = adData.map((asset: any) => ({
          id: asset.asset_id || asset.id || asset.dolphin_id,
          asset_id: asset.asset_id || asset.id,
          dolphin_id: asset.dolphin_id,
          name: asset.name,
          type: asset.type,
          status: asset.status,
          metadata: asset.metadata
        }))
        
        setAssets([...transformedBMs, ...transformedAds])
      } else {
        // For additional accounts, get unbound ad accounts for the specific BM
        let adResponse;
        if (mode === 'additional-accounts-specific' && targetBmId) {
          // Fetch only unbound ad accounts for the specific BM
          adResponse = await fetch(`/api/admin/unbound-assets?type=ad_account&business_manager_id=${targetBmId}`)
        } else {
          // Fetch all unbound ad accounts for general mode
          adResponse = await fetch("/api/admin/unbound-assets?type=ad_account")
        }
        
        if (!adResponse.ok) {
          throw new Error("Failed to fetch available ad accounts")
        }
        const adData = await adResponse.json()
        console.log('API response for additional accounts:', adData);
        
        let allAssets = Array.isArray(adData) ? adData.map(asset => ({
          ...asset,
          id: asset.asset_id || asset.id || asset.dolphin_id,
          type: asset.type,
          asset_id: asset.asset_id || asset.id,
          metadata: asset.metadata
        })) : []
        
        console.log('Transformed assets for additional accounts:', allAssets);
        
        // For specific BM requests, we also need to fetch the target BM
        if (mode === 'additional-accounts-specific' && targetBmId) {
          try {
            const bmResponse = await fetch(`/api/admin/assets?type=business_manager`)
            if (bmResponse.ok) {
              const bmData = await bmResponse.json()
              const targetBM = bmData.assets?.find((asset: any) => {
                // Use the transformed field names from the API response
                return asset.dolphinId === targetBmId || asset.id === targetBmId || asset.assetId === targetBmId;
              })
              
              if (targetBM) {
                const transformedBM = {
                  ...targetBM,
                  id: targetBM.assetId || targetBM.id || targetBM.dolphinId,
                  type: 'business_manager',
                  asset_id: targetBM.assetId || targetBM.id,
                  dolphin_id: targetBM.dolphinId,
                  metadata: targetBM.metadata
                };
                allAssets.push(transformedBM);
              }
            }
          } catch (error) {
            console.error('Error fetching target BM:', error);
          }
        }
        
        setAssets(allAssets)
      }
    } catch (error) {
      console.error("Failed to load assets:", error)
      setError("Could not load available assets. Please try again.")
    } finally {
      setLoadingAssets(false)
    }
  }, [mode, targetBmId]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      loadAvailableAssets()
      setSelectedAdAccounts([])
      setSearchTerm("")
      setError(null)

      // Set initial BM selection based on mode
      if (mode === 'additional-accounts-specific' && targetBmId) {
        // For specific mode, the targetBmId should automatically select the target BM
        // We'll use the targetBmId directly since our lookup logic now handles multiple ID formats
        setSelectedBusinessManager(targetBmId)
      } else {
        setSelectedBusinessManager(null)
      }
    }
  }, [open, loadAvailableAssets, mode, targetBmId])

  const handleSubmit = async () => {
    if (!application?.applicationId) {
      setError("Application ID is missing. Cannot proceed.")
      return
    }

    if (!selectedBusinessManager && mode !== 'additional-accounts-specific') {
      setError("Please select a Business Manager to proceed.")
      return
    }

    if (selectedAdAccounts.length === 0) {
      setError("Please select at least one ad account to assign.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      let endpoint = '/api/admin/fulfill-bm-application'
      let payload: any = {
        application_id: application.applicationId,
        organization_id: application.organizationId || null,
        request_type: mode,
      }

      if (mode === 'new-bm') {
        payload.dolphin_id = selectedBusinessManager
        payload.selected_ad_accounts = selectedAdAccounts
      } else {
        // Additional accounts request
        payload.target_bm_id = selectedBusinessManager || targetBmId
        payload.selected_ad_accounts = selectedAdAccounts
        endpoint = '/api/admin/fulfill-additional-accounts'
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fulfill application');
      }

      const result = await response.json();
// console.log('Application fulfilled successfully:', result);

      const successMessage = mode === 'new-bm' 
        ? "Business Manager application fulfilled successfully!"
        : `${selectedAdAccounts.length} ad accounts assigned successfully!`
      
      toast.success(successMessage);
      
      // Refresh relevant data
      mutate('/api/bm-applications');
      mutate('/api/admin/applications');
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Fulfillment error:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setLoading(false)
    }
  }

  // Filter and categorize assets based on mode
  const businessManagers = useMemo(() => {
    if (mode === 'additional-accounts-specific') {
      // For specific BM requests, find the target BM in assets
      const targetBMs = assets.filter(asset => asset.id === targetBmId || asset.dolphin_id === targetBmId);
      return targetBMs;
    }
    
    if (mode === 'additional-accounts-general') {
      // For general additional requests, use existing BMs
      const mappedBMs = existingBMs.map(bm => ({
        id: bm.id,
        name: bm.name,
        asset_id: bm.id,
        status: 'active',
        type: 'business_manager'
      }))
      return mappedBMs
    }

    // For new BM requests, show unbound BMs
    const bmAssets = assets.filter(asset => asset.type === 'business_manager')
    
    const filteredBMs = bmAssets.filter(asset => 
      searchTerm === "" || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.dolphin_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return filteredBMs
  }, [assets, searchTerm, mode, targetBmId, existingBMs])

  const adAccounts = useMemo(() => {
    // For additional-accounts-specific mode, the API already filtered by BM
    // So we just need to return all ad accounts (they're already filtered)
    if (mode === 'additional-accounts-specific') {
      const accounts = assets.filter(asset => asset.type === 'ad_account');
      console.log('Additional accounts specific mode - found accounts:', accounts.length, accounts);
      return accounts;
    }
    
    // For other modes, we need a selected business manager
    if (!selectedBusinessManager) return []
    
    let selectedBM
    if (mode === 'new-bm') {
      selectedBM = assets.find(asset => asset.id === selectedBusinessManager)
    } else {
      selectedBM = businessManagers.find(bm => 
        bm.id === selectedBusinessManager || 
        ('dolphin_id' in bm && bm.dolphin_id === selectedBusinessManager) ||
        ('asset_id' in bm && bm.asset_id === selectedBusinessManager)
      )
    }
    
    if (!selectedBM) {
      return []
    }
    
    // For other modes, apply the original filtering logic
    const filteredAccounts = assets
      .filter(asset => asset.type === 'ad_account')
      .filter(asset => {
        if (mode === 'new-bm') {
          const bmDolphinId = ('dolphin_id' in selectedBM && selectedBM.dolphin_id) || selectedBM.id;
          return asset.metadata?.business_manager_id === bmDolphinId;
        }
        return true;
      })

    return filteredAccounts;
  }, [assets, selectedBusinessManager, mode, businessManagers])

  const handleBusinessManagerSelect = (bmId: string) => {
    setSelectedBusinessManager(bmId)
    setSelectedAdAccounts([]) // Reset ad account selection when BM changes
  }

  const toggleAdAccount = (assetId: string) => {
    setSelectedAdAccounts(prev => 
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const selectAllAdAccounts = () => {
    setSelectedAdAccounts(adAccounts.map(account => account.id))
  }

  const clearAdAccountSelection = () => {
    setSelectedAdAccounts([])
  }

  const selectedBM = useMemo(() => {
    return businessManagers.find(bm => bm.id === selectedBusinessManager)
  }, [businessManagers, selectedBusinessManager])

  const getCurrentAccountCount = useMemo(() => {
    if (mode === 'additional-accounts-general') {
      const existingBM = existingBMs.find(bm => bm.id === selectedBusinessManager)
      return existingBM?.current_account_count || 0
    }
    return 0
  }, [mode, existingBMs, selectedBusinessManager])

  const getDialogConfig = () => {
    switch (mode) {
      case 'new-bm':
        return {
          title: "Fulfill New Business Manager Application",
          description: `Assign a Business Manager and its ad accounts to "${application?.organization_name}".`,
          badge: "New BM Request",
          buttonText: "Assign Business Manager & Accounts"
        }
      case 'additional-accounts-specific':
        return {
          title: "Fulfill Additional Ad Accounts Request",
          description: `Assign additional ad accounts to the specified Business Manager for "${application?.organization_name}".`,
          badge: "Additional Accounts Request",
          buttonText: "Assign Additional Accounts"
        }
      case 'additional-accounts-general':
        return {
          title: "Fulfill Additional Ad Accounts Request",
          description: `Assign additional ad accounts to the selected Business Manager for "${application?.organization_name}".`,
          badge: "Additional Accounts Request",
          buttonText: "Assign Additional Accounts"
        }
    }
  }

  if (!application) return null;

  const dialogConfig = getDialogConfig()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg">{dialogConfig.title}</DialogTitle>
          <DialogDescription className="text-sm">
                          {application.organization_name} • {application.business_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {loadingAssets ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Loading assets...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search - only for new BM mode */}
              {mode === 'new-bm' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search business managers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              )}

              {/* Business Manager Selection */}
              {mode !== 'additional-accounts-specific' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {mode === 'new-bm' ? 'Business Manager' : 'Target Business Manager'}
                  </Label>
                  
                  {businessManagers.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {searchTerm ? 'No business managers match your search.' : 'No available business managers.'}
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {businessManagers.map((bm, index) => {
                        return (
                        <div 
                          key={bm.id || ('dolphin_id' in bm ? bm.dolphin_id : '') || index}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors",
                            selectedBusinessManager === bm.id 
                              ? "bg-primary/10 border-primary" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => handleBusinessManagerSelect(bm.id)}
                        >
                          <input
                            type="radio"
                            name="business-manager"
                            value={bm.id}
                            checked={selectedBusinessManager === bm.id}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleBusinessManagerSelect(bm.id)
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{bm.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {('dolphin_id' in bm && bm.dolphin_id) || bm.id}
                              {mode === 'additional-accounts-general' && (
                                <span className="ml-2 text-blue-600">
                                  {getCurrentAccountCount}/7 accounts
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Pre-selected BM info for specific mode */}
              {mode === 'additional-accounts-specific' && selectedBM && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">{selectedBM.name}</div>
                    <div className="text-xs text-blue-600">{('dolphin_id' in selectedBM && selectedBM.dolphin_id) || selectedBM.id}</div>
                  </div>
                </div>
              )}

              {/* Ad Accounts Selection */}
              {(selectedBusinessManager || mode === 'additional-accounts-specific') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {mode === 'new-bm' ? 'Ad Accounts' : 'Additional Accounts'} ({adAccounts.length})
                    </Label>
                    {adAccounts.length > 0 && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllAdAccounts}
                          disabled={selectedAdAccounts.length === adAccounts.length}
                          className="h-7 px-2 text-xs"
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAdAccountSelection}
                          disabled={selectedAdAccounts.length === 0}
                          className="h-7 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Provider limit warning */}
                  {selectedAdAccounts.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {mode === 'additional-accounts-general' && getCurrentAccountCount + selectedAdAccounts.length > 7 && (
                        <span className="text-foreground">⚠️ Exceeds 7-account limit</span>
                      )}
                      {mode === 'new-bm' && selectedAdAccounts.length > 7 && (
                        <span className="text-foreground">⚠️ More than 7 accounts selected</span>
                      )}
                    </div>
                  )}

                  {adAccounts.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No available ad accounts.
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {adAccounts.map((account) => (
                        <div 
                          key={account.id}
                          className={cn(
                            "flex items-center space-x-3 p-2 rounded-md border cursor-pointer transition-colors",
                            selectedAdAccounts.includes(account.id) 
                              ? "bg-primary/10 border-primary" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleAdAccount(account.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAdAccounts.includes(account.id)}
                            onChange={() => toggleAdAccount(account.id)}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{account.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {account.id} • {account.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Compact Summary */}
              {(selectedBusinessManager || mode === 'additional-accounts-specific') && selectedAdAccounts.length > 0 && (
                <div className="border border-border rounded-md p-3">
                  <div className="text-sm text-foreground">
                    <div className="font-medium">Ready to assign:</div>
                    <div className="text-xs mt-1 text-muted-foreground">
                      {mode === 'new-bm' ? '1 Business Manager + ' : ''}{selectedAdAccounts.length} ad account{selectedAdAccounts.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} size="sm">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || loadingAssets || (mode !== 'additional-accounts-specific' && !selectedBusinessManager) || selectedAdAccounts.length === 0}
            className="bg-primary hover:from-[#b4a0ff] to-[#ffb4a0] text-black border-0"
            size="sm"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dialogConfig.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 