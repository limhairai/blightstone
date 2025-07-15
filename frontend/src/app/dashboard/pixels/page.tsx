'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Info, Building2, Loader2, Power, PowerOff, MoreHorizontal, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PixelRequestDialog } from '@/components/pixels/pixel-request-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { StatusBadge } from '@/components/ui/status-badge'
import { AssetDeactivationDialog } from '@/components/dashboard/AssetDeactivationDialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface PixelData {
  id: string
  type: 'asset' | 'application'
  pixel_id: string
  pixel_name: string
  business_manager_id: string
  business_manager_name?: string
  status: 'active' | 'pending' | 'processing' | 'rejected'
  is_active?: boolean
  created_at: string
  updated_at: string
  adAccounts?: any[] // Added for new display
}

interface BusinessManager {
  asset_id: string
  name: string
  dolphin_id: string
  status: string
  is_active: boolean
}

export default function PixelsPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [pixels, setPixels] = useState<PixelData[]>([])
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionLimit, setSubscriptionLimit] = useState<number>(0)
  const [deactivationDialog, setDeactivationDialog] = useState<{
    open: boolean;
    asset: any | null;
  }>({ open: false, asset: null })

  const fetchPixels = async () => {
    if (!session?.access_token || !currentOrganizationId) return

    try {
      console.log('Fetching pixels for organization:', currentOrganizationId)
      const response = await fetch(`/api/organizations/${currentOrganizationId}/pixels`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Pixel fetch failed with status:', response.status)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to fetch pixels')
      }

      const data = await response.json()
      console.log('Pixels response:', data)
      
      // Transform the pixels data to match the expected format
      const transformedPixels = (data.pixels || []).map((pixel: any) => ({
        id: pixel.id || pixel.pixelId,
        pixel_id: pixel.pixelId,
        pixel_name: pixel.pixelName,
        business_manager_id: pixel.businessManagerId,
        business_manager_name: pixel.businessManagerName,
        adAccounts: pixel.adAccounts || [],
        status: pixel.status,
        is_active: pixel.is_active !== false
      }))
      
      setPixels(transformedPixels)
      setSubscriptionLimit(data.subscription_limit || 0)
    } catch (error) {
      console.error('Error fetching pixels:', error)
      setError('Failed to load pixels')
    }
  }

  const fetchBusinessManagers = async () => {
    if (!session?.access_token || !currentOrganizationId) return

    try {
      console.log('Fetching business managers for organization:', currentOrganizationId)
      const response = await fetch(`/api/organizations/${currentOrganizationId}/business-managers`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch business managers')
      }

      const data = await response.json()
      console.log('Business managers response:', data)
      
      // Only show active business managers for pixel connections
      const activeBusinessManagers = data.business_managers?.filter((bm: BusinessManager) => 
        bm.status === 'active' && bm.is_active !== false && bm.dolphin_id
      ) || []
      
      console.log('Active business managers:', activeBusinessManagers)
      setBusinessManagers(activeBusinessManagers)
    } catch (error) {
      console.error('Error fetching business managers:', error)
      toast.error('Failed to load business managers')
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([fetchPixels(), fetchBusinessManagers()])
    setLoading(false)
  }

  const handleRequestSubmitted = () => {
    fetchPixels() // Refresh to show new pending request
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
      const response = await fetch(`/api/applications/${pixel.id}/cancel`, {
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
      fetchPixels() // Refresh the list
    } catch (error) {
      console.error('Error cancelling application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel application')
    }
  }

  useEffect(() => {
    handleRefresh()
  }, [session?.access_token, currentOrganizationId])

  // Calculate active pixels based on the new data structure
  const activePixels = pixels.filter(pixel => pixel.is_active && pixel.status === 'active').length
  const pendingPixels = 0 // TODO: Add pending pixel applications if needed from the API

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
              {activePixels} / {subscriptionLimit === -1 ? '∞' : subscriptionLimit}
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

      {/* Pixel limit warning */}
      {subscriptionLimit > 0 && activePixels >= subscriptionLimit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You've reached your pixel limit ({subscriptionLimit} pixels). Upgrade your plan to add more pixels.
          </AlertDescription>
        </Alert>
      )}

      {/* Zero pixels allowed warning */}
      {subscriptionLimit === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your current plan doesn't include pixel connections. Upgrade your plan to add pixels.
          </AlertDescription>
        </Alert>
      )}

      {/* No business managers warning */}
      {businessManagers.length === 0 && (
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
          pixels.map((pixel) => (
            <div
              key={pixel.id}
              className={`bg-card border rounded-lg p-4 shadow-sm transition-all ${
                pixel.is_active === false ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {pixel.pixel_name || `Pixel ${pixel.pixel_id}`}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>ID: {pixel.pixel_id}</span>
                      {pixel.business_manager_name && (
                        <>
                          <span>•</span>
                          <span>BM: {pixel.business_manager_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {pixel.adAccounts?.length || 0} ad account{(pixel.adAccounts?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {pixel.is_active === false ? (
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

                  {/* Actions */}
                  {pixel.status === 'active' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          ))
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
          onSuccess={handleRefresh}
        />
      )}
    </div>
  )
} 