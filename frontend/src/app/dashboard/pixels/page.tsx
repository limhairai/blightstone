'use client'

import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { authenticatedFetcher, useBusinessManagers } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Info, Building2, Loader2, Power, PowerOff, Search, Users, Heart, HelpCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showHowToDialog, setShowHowToDialog] = useState(false)

  // ✅ FIXED: Optimized SWR data fetching with proper cache revalidation
  const { data: pixelsData, error: pixelsError, isLoading: pixelsLoading, mutate: mutatePixels } = useSWR(
    session?.access_token && currentOrganizationId 
      ? [`/api/organizations/${currentOrganizationId}/pixels`, session.access_token] 
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: true, // ✅ FIXED: Enable focus revalidation for data freshness
      revalidateOnReconnect: true, // ✅ FIXED: Enable reconnect revalidation  
      revalidateIfStale: true, // ✅ FIXED: Update stale data automatically
      dedupingInterval: 60000, // 60 seconds - pixels don't change frequently
      keepPreviousData: true, // ✅ Smooth transitions
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

  // ✅ FIXED: Conditional debug logging for development only
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Business Managers Debug:', {
      businessManagersData,
      filteredBusinessManagers: businessManagers,
      bmError,
      bmLoading
    })
  }
  const loading = pixelsLoading || bmLoading
  const error = pixelsError || bmError

  // Filter pixels based on search and status
  const filteredPixels = useMemo(() => {
    let filtered = pixels

    if (searchQuery) {
      filtered = filtered.filter(
        (pixel: any) =>
          pixel.pixel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pixel.pixel_id.includes(searchQuery) ||
          (pixel.business_manager_name && pixel.business_manager_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        // Show pending requests
        filtered = filtered.filter((pixel: any) => pixel.type === 'application' && pixel.status === 'pending')
      } else if (statusFilter === "processing") {
        // Show processing requests
        filtered = filtered.filter((pixel: any) => pixel.type === 'application' && pixel.status === 'processing')
      } else if (statusFilter === "active") {
        // Show active pixels only
        filtered = filtered.filter((pixel: any) => pixel.type !== 'application' && pixel.status === 'active' && pixel.is_active !== false)
      } else if (statusFilter === "inactive") {
        // Show inactive/deactivated pixels
        filtered = filtered.filter((pixel: any) => pixel.type !== 'application' && (pixel.status === 'inactive' || pixel.is_active === false))
      }
    }

    return filtered
  }, [pixels, searchQuery, statusFilter])

  // Calculate metrics
  const activePixels = pixels.filter((pixel: any) => pixel.type !== 'application' && pixel.status === 'active' && pixel.is_active !== false).length
  const pendingRequests = pixels.filter((pixel: any) => pixel.type === 'application').length

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
            <div className="text-muted-foreground font-semibold text-lg">
              {pendingRequests}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Dialog open={showHowToDialog} onOpenChange={setShowHowToDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <HelpCircle className="mr-2 h-4 w-4" />
                How to
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl">How to Connect Facebook Pixels</DialogTitle>
                <DialogDescription className="text-base">
                  Connect your existing pixels to our Business Manager for tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-base mb-3 text-foreground">Existing Pixels</h4>
                  <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside leading-relaxed">
                    <li className="pl-2">Go to Facebook Business Settings</li>
                    <li className="pl-2">Find "Datasets & Pixels" in the left menu</li>
                    <li className="pl-2">Click "Partners" → "Assign Partner"</li>
                    <li className="pl-2">Select "Use events dataset"</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
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

      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pixels, pixel IDs, or business managers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-background border-border text-foreground">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
              All Status
            </SelectItem>
            <SelectItem value="active" className="text-popover-foreground hover:bg-accent">
              Active
            </SelectItem>
            <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent">
              Inactive
            </SelectItem>
            <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
              Pending Request
            </SelectItem>
            <SelectItem value="processing" className="text-popover-foreground hover:bg-accent">
              Processing Request
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pixels Table */}
      <div className="bg-card rounded-lg border border-border">
        {/* Table Headers */}
        <div 
          className="grid gap-4 px-6 py-4 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "2fr 180px 1fr 180px 120px 150px" }}
        >
          <div className="flex items-center">PIXEL</div>
          <div className="flex items-center">PIXEL ID</div>
          <div className="flex items-center">BM NAME</div>
          <div className="flex items-center">BM ID</div>
          <div className="flex items-center">STATUS</div>
          <div className="flex items-center">ACTIONS</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredPixels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== "all" ? "No pixels match your filters" : "No pixels found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Request your first pixel connection to get started"
                }
              </p>
            </div>
          ) : (
            filteredPixels.map((pixel: any) => {
              const isPendingApplication = pixel.type === 'application';
              
              return (
                <div
                  key={pixel.id}
                  className={`grid gap-4 px-6 py-5 transition-colors group border-b border-border ${
                    isPendingApplication 
                      ? 'cursor-default' 
                      : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                  style={{ gridTemplateColumns: "2fr 180px 1fr 180px 120px 150px" }}
                >
                  {/* Pixel */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-[#b4a0ff]" />
                    </div>
                    <div className="min-w-0">
                      <div className={`font-medium flex items-center gap-2 ${
                        isPendingApplication ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        <span className="truncate">
                          {(pixel as any).pixel_name || pixel.pixel_name || `Pixel ${pixel.pixel_id}`}
                        </span>
                        {isPendingApplication && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-foreground border border-border rounded-full dark:bg-secondary/20 dark:text-foreground dark:border-border flex-shrink-0">
                            <div className="w-1.5 h-1.5 bg-secondary rounded-full mr-1.5 animate-pulse"></div>
                            Connection Pending
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {isPendingApplication && (
                          <span>Awaiting connection</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pixel ID */}
                  <div className="flex items-center">
                    <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                      {pixel.pixel_id}
                    </div>
                  </div>

                  {/* BM Name */}
                  <div className="flex items-center">
                    {((pixel as any).bm_name || pixel.business_manager_name) ? (
                      <span className="text-sm text-foreground truncate">
                        {(pixel as any).bm_name || pixel.business_manager_name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isPendingApplication ? 'Pending Assignment' : 'Not assigned'}
                      </span>
                    )}
                  </div>

                  {/* BM ID */}
                  <div className="flex items-center">
                    {pixel.business_manager_id ? (
                      <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                        {pixel.business_manager_id}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {isPendingApplication ? 'Pending' : '-'}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    {pixel.is_active === false && !isPendingApplication ? (
                      <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                        Deactivated
                      </Badge>
                    ) : (
                      <StatusBadge 
                        status={pixel.status as any} 
                        size="sm" 
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center">
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
            );
            })
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredPixels.length} of {pixels.length} pixels
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