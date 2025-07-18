'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { authenticatedFetcher, useBusinessManagers } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Info, Building2, Loader2, Power, PowerOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PixelRequestDialog } from '@/components/pixels/pixel-request-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { StatusBadge } from '@/components/ui/status-badge'
import { AssetDeactivationDialog } from '@/components/dashboard/AssetDeactivationDialog'
// Dropdown menu imports removed - no longer needed
import { toast } from 'sonner'
import { shouldEnablePixelLimits } from '@/lib/config/pricing-config'

interface PixelData {
  id: string
  type?: 'asset' | 'application'
  pixel_id: string
  pixel_name: string
  business_manager_id: string
  business_manager_name?: string
  status: 'active' | 'pending' | 'processing' | 'rejected'
  is_active?: boolean
  created_at?: string
  updated_at?: string
  adAccounts?: any[] // Added for new display
  application_id?: string // For pending applications
}

interface BusinessManager {
  asset_id: string
  name: string
  dolphin_business_manager_id: string
  status: string
  is_active: boolean
}

export default function PixelsPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [subscriptionLimit, setSubscriptionLimit] = useState<number>(0)
  const [deactivationDialog, setDeactivationDialog] = useState<{
    open: boolean;
    asset: any | null;
  }>({ open: false, asset: null })

  // Optimized SWR data fetching with caching
  const { data: pixelsData, error: pixelsError, isLoading: pixelsLoading, mutate: mutatePixels } = useSWR(
    session?.access_token && currentOrganizationId 
      ? [`/api/organizations/${currentOrganizationId}/pixels`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 seconds - pixels don't change frequently
    }
  )

  const { data: businessManagersData, error: bmError, isLoading: bmLoading, mutate: mutateBM } = useBusinessManagers()

  // Transform and extract data
  const pixels = pixelsData?.pixels ? pixelsData.pixels.map((pixel: any) => ({
    id: pixel.id || pixel.pixelId,
    type: pixel.type || 'asset',
    pixel_id: pixel.pixelId,
    pixel_name: pixel.pixelName,
    business_manager_id: pixel.businessManagerId,
    business_manager_name: pixel.businessManagerName,
    adAccounts: pixel.adAccounts || [],
    status: pixel.status,
    is_active: pixel.isActive !== false,
    application_id: pixel.applicationId,
    created_at: pixel.createdAt
  })) : []

  // The API returns an array directly, not an object with business_managers property
  const businessManagers = Array.isArray(businessManagersData) 
    ? businessManagersData.filter((bm: BusinessManager) => 
        bm.status === 'active' && bm.is_active !== false && bm.dolphin_business_manager_id
      )
    : []

  // Debug logging to understand the data structure
  console.log('🔍 Business Managers Debug:', {
    businessManagersData,
    filteredBusinessManagers: businessManagers,
    bmError,
    bmLoading
  })
  const loading = pixelsLoading || bmLoading
  const error = pixelsError || bmError

  // Update subscription limit when pixels data changes
  useEffect(() => {
    if (pixelsData?.subscriptionLimit) {
      setSubscriptionLimit(pixelsData.subscriptionLimit)
    }
  }, [pixelsData?.subscriptionLimit])

  const handleRefresh = async () => {
    // Use SWR mutate to refresh data from cache
    await Promise.all([mutatePixels(), mutateBM()])
  }

  const handleRequestSubmitted = () => {
    // Refresh pixels to show new pending request
    mutatePixels()
  }

  const handleDeactivationClick = (pixel: PixelData) => {
    if (pixel.type !== 'asset') return // Only assets can be deactivated
    
    setDeactivationDialog({
      open: true,
      asset: {
        id: pixel.id,
        asset_id: pixel.id,
        name: pixel.pixel_name,
        type: 'pixel',
        is_active: pixel.is_active !== false
      }
    })
  }

  const handleCancelApplication = async (pixel: PixelData) => {
    if (pixel.type !== 'application') return

    try {
      const applicationId = pixel.application_id || pixel.id
      const response = await fetch(`/api/applications/${applicationId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel application')
      }

      toast.success('Pixel connection request cancelled successfully')
      mutatePixels() // Refresh the list
    } catch (error) {
      console.error('Error cancelling application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel application')
    }
  }

  // SWR handles data fetching automatically, no need for manual useEffect

  // Calculate active pixels based on the new data structure
  const activePixels = pixels.filter((pixel: any) => pixel.is_active && pixel.status === 'active').length
  const pendingPixels = pixels.filter((pixel: any) => pixel.status === 'pending' || pixel.status === 'processing').length

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex items-center justify-between">
        {/* Left: Metrics */}
        <div className="flex items-start gap-12 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Active Pixels
            </span>
            <div className="text-foreground font-semibold text-lg">
              {shouldEnablePixelLimits() ? `${activePixels} / ${subscriptionLimit === -1 ? '∞' : subscriptionLimit}` : activePixels}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Pending Requests
            </span>
            <div className="text-foreground font-semibold text-lg">
              {pendingPixels}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <PixelRequestDialog 
            businessManagers={businessManagers}
            onRequestSubmitted={handleRequestSubmitted}
          />
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Pixel limit warnings - controlled by feature flag */}
      {shouldEnablePixelLimits() && (
        <>
          {/* Pixel limit warning */}
          {subscriptionLimit > 0 && activePixels >= subscriptionLimit && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You've reached your pixel limit ({subscriptionLimit} pixels). Upgrade your plan to add more pixels.
              </AlertDescription>
            </Alert>
          )}

          {/* Zero pixels allowed warning - only show after data has loaded */}
          {!loading && subscriptionLimit === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your current plan doesn't include pixel connections. Upgrade your plan to add pixels.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* No business managers warning - only show after data has loaded */}
      {!loading && businessManagers.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You need at least one active Business Manager to request pixel connections. 
            Please apply for a Business Manager first.
          </AlertDescription>
        </Alert>
      )}

      {/* Pixels List */}
      <div className="space-y-3">
        {pixels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">No pixels found</h3>
            <p className="text-sm text-muted-foreground">
              Request your first pixel connection to get started
            </p>
          </div>
        ) : (
          pixels.map((pixel: any) => {
            const isPendingApplication = pixel.type === 'application';
            const isGreyedOut = isPendingApplication || pixel.is_active === false;
            
            return (
              <div
                key={pixel.id}
                className={`bg-card border rounded-lg p-4 shadow-sm transition-all ${
                  isGreyedOut ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className={`font-semibold ${isPendingApplication ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {(pixel as any).pixel_name || pixel.pixel_name || `Pixel ${pixel.pixel_id}`}
                        {isPendingApplication && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 animate-pulse"></div>
                            Connection Pending
                          </span>
                        )}
                      </div>
                      <div className={`text-sm flex items-center gap-2 ${isPendingApplication ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        <span>ID: {pixel.pixel_id}</span>
                        {((pixel as any).bm_name || pixel.business_manager_name) && (
                          <>
                            <span>•</span>
                            <span>BM: {(pixel as any).bm_name || pixel.business_manager_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {isPendingApplication ? 'Awaiting connection' : 
                            `${pixel.adAccounts?.length || (pixel as any).ad_accounts?.length || 0} ad account${((pixel.adAccounts?.length || (pixel as any).ad_accounts?.length || 0) !== 1) ? 's' : ''}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {pixel.is_active === false && !isPendingApplication ? (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          Deactivated
                        </span>
                      ) : (
                        <StatusBadge 
                          status={pixel.status as any} 
                          size="sm" 
                        />
                      )}
                    </div>

                    {/* Actions dropdown removed - no functionality implemented */}
                    
                    {/* Cancel button for pending applications */}
                    {isPendingApplication && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelApplication(pixel as any)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deactivation Dialog */}
      {deactivationDialog.asset && (
        <AssetDeactivationDialog
          asset={deactivationDialog.asset}
          open={deactivationDialog.open}
          onOpenChange={(open) => setDeactivationDialog({ 
            open, 
            asset: open ? deactivationDialog.asset : null 
          })}
          onSuccess={mutatePixels}
        />
      )}
    </div>
  )
} 