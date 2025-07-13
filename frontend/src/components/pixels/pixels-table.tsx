"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Search, Building2, Loader2, Info, ExternalLink, X, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

interface PixelsTableProps {
  pixels: PixelData[]
  loading: boolean
  onRefresh: () => void
  error?: string | null
}

// Sharing Instructions Modal Component
function SharingInstructionsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          How to Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div>
              <span className="text-white">Ad</span>
              <span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">Hub</span>
              <span className="text-muted-foreground ml-2">Pixel Sharing Guide</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Follow these steps to share your Facebook pixel with your AdHub Business Manager:
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <div className="font-medium mb-1">Access Your Original Business Manager</div>
                <div className="text-sm text-muted-foreground">
                  Go to your original Facebook Business Manager where your pixel is located
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <div className="font-medium mb-1">Navigate to Datasets & Pixels</div>
                <div className="text-sm text-muted-foreground">
                  Go to <code className="bg-muted px-1 py-0.5 rounded text-xs">Data Sources → Datasets & pixels</code>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <div className="font-medium mb-1">Select Your Pixel</div>
                <div className="text-sm text-muted-foreground">
                  Click on your pixel from the list to open its details
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <div className="font-medium mb-1">Go to Partners Tab</div>
                <div className="text-sm text-muted-foreground">
                  Click on the <strong>Partners</strong> tab in the pixel details
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </div>
              <div>
                <div className="font-medium mb-1">Assign Partner</div>
                <div className="text-sm text-muted-foreground">
                  Click <strong>Assign partner</strong> and enter your AdHub Business Manager ID
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 rounded-full flex items-center justify-center text-sm font-semibold">
                6
              </div>
              <div>
                <div className="font-medium mb-1">Select Partial Access</div>
                <div className="text-sm text-muted-foreground">
                  Choose <strong>Partial access</strong> and select "Use events dataset" permission
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 p-4 rounded-lg border border-[#b4a0ff]/20">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#b4a0ff] mt-0.5" />
              <div>
                <div className="font-medium text-sm mb-1">Manual Processing</div>
                <div className="text-sm text-muted-foreground">
                  After you assign the partner, we'll need to manually accept the sharing request and assign the necessary permissions. 
                  Your pixel will appear in this dashboard within 24 hours after processing.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PixelsTable({ pixels, loading, onRefresh, error }: PixelsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")

  const filteredPixels = useMemo(() => {
    let filtered = pixels

    if (searchQuery) {
      filtered = filtered.filter(
        (pixel) =>
          pixel.pixel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pixel.bm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pixel.bm_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((pixel) => pixel.status === statusFilter)
    }

    // Sort pixels
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "pixel_id":
          return a.pixel_id.localeCompare(b.pixel_id)
        case "accounts":
          return b.ad_accounts.length - a.ad_accounts.length
        default:
          return 0
      }
    })
  }, [pixels, searchQuery, statusFilter, sortBy])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading pixels...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Unable to load pixels</h3>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pixels, BM names, or pixel IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pixel_id">Pixel ID</SelectItem>
              <SelectItem value="accounts">Ad Accounts</SelectItem>
            </SelectContent>
          </Select>
          <SharingInstructionsModal />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredPixels.length} of {pixels.length} pixels
          {searchQuery && ` matching "${searchQuery}"`}
        </span>
      </div>

      {/* Pixels Table */}
      <div className="border rounded-lg overflow-hidden">
        {filteredPixels.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pixels found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search or filters.' : 'Share a pixel from your Business Manager to get started.'}
            </p>
            {!searchQuery && <SharingInstructionsModal />}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Pixel ID</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Business Manager</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Ad Accounts</th>
                </tr>
              </thead>
              <tbody>
                {filteredPixels.map((pixel, index) => (
                  <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 dark:from-[#b4a0ff]/20 dark:to-[#ffb4a0]/20 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-foreground">
                            P
                          </span>
                        </div>
                        <div className="font-mono text-sm">
                          {pixel.pixel_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-sm">{pixel.bm_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {pixel.bm_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(pixel.status)}>
                        {pixel.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {pixel.ad_accounts.length} account{pixel.ad_accounts.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pixel.ad_accounts.slice(0, 2).map(acc => acc.name).join(', ')}
                        {pixel.ad_accounts.length > 2 && ` +${pixel.ad_accounts.length - 2} more`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 