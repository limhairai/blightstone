'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PixelsTable } from '@/components/pixels/pixels-table'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface PixelData {
  pixel_id: string
  bm_id: string
  bm_name: string
  status: 'active' | 'pending' | 'inactive'
  ad_accounts: Array<{
    id: string
    name: string
    account_id: string
  }>
}

interface PixelResponse {
  pixels: PixelData[]
  total_pixels: number
  total_bms: number
  subscription_limit: number
}

export default function PixelsPage() {
  const { session } = useAuth()
  const [pixels, setPixels] = useState<PixelData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionLimit, setSubscriptionLimit] = useState(0)

  const fetchPixels = async () => {
    if (!session?.access_token) {
      setError('Authentication required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/pixels', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch pixels' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data: PixelResponse = await response.json()
      setPixels(data.pixels)
      setSubscriptionLimit(data.subscription_limit)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error('Failed to load pixels', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.access_token) {
      fetchPixels()
    }
  }, [session?.access_token])

  const activePixels = pixels.filter(p => p.status === 'active').length
  const totalAdAccounts = pixels.reduce((total, pixel) => total + pixel.ad_accounts.length, 0)

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
              {activePixels} / {subscriptionLimit}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Connected Ad Accounts
            </span>
            <div className="text-foreground font-semibold text-lg">
              {totalAdAccounts}
            </div>
          </div>
        </div>

        {/* Right: Refresh Button */}
        <Button
          onClick={fetchPixels}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Pixel limit warning */}
      {activePixels >= subscriptionLimit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You've reached your pixel limit ({subscriptionLimit} pixels). Upgrade your plan to add more pixels.
          </AlertDescription>
        </Alert>
      )}

      {/* Pixels Table */}
      <PixelsTable 
        pixels={pixels} 
        loading={loading} 
        onRefresh={fetchPixels}
        error={error}
      />
    </div>
  )
} 