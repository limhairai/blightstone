"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { authenticatedFetcher } from '@/lib/swr-config'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Plus, 
  ExternalLink, 
  Users, 
  Heart, 
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Info,
  Search,
  HelpCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface FacebookPage {
  page_id: string
  facebook_page_id: string
  page_name: string
  page_url?: string
  category?: string
  verification_status: 'verified' | 'unverified' | 'pending'
  status: 'active' | 'inactive' | 'suspended'
  followers_count: number
  likes_count: number
  created_at: string
  updated_at: string
  // BM information from bm_pages table
  bm_name?: string
  bm_id?: string
  business_manager_id?: string
  // Request status for pending requests
  request_status?: 'pending' | 'processing' | 'completed' | 'rejected'
  is_request?: boolean
}

interface PagesResponse {
  pages: FacebookPage[]
  pagination: {
    total: number
    limit: number
    canAddMore: boolean
  }
}

// Helper functions
const getVerificationIcon = (status: string) => {
  switch (status) {
    case 'verified':
      return <Verified className="h-4 w-4 text-blue-500" />
    case 'pending':
      return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />
  }
}

const getStatusBadge = (status: string) => {
  const variants = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800'
  }
  
  return (
    <Badge className={variants[status as keyof typeof variants] || variants.inactive}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function PagesPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showHowToDialog, setShowHowToDialog] = useState(false)
  const [newPageForm, setNewPageForm] = useState({
    facebook_page_id: '',
    page_name: '',
    page_url: ''
  })

  // Fetch pages data
  const { data: pagesData, error, isLoading, mutate } = useSWR<PagesResponse>(
    session?.access_token && currentOrganizationId 
      ? [`/api/pages?organization_id=${currentOrganizationId}`, session.access_token]
      : null,
    ([url, token]: [string, string]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  // Fetch page requests data
  const { data: pageRequestsData, error: requestsError, mutate: mutateRequests } = useSWR<any>(
    session?.access_token && currentOrganizationId 
      ? [`/api/page-requests?organization_id=${currentOrganizationId}`, session.access_token]
      : null,
    ([url, token]: [string, string]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  // Combine active pages with pending page requests
  const activePagesData = pagesData?.pages || []
  const pendingRequestsData = pageRequestsData?.pageRequests || []
  
  // Convert page requests to page-like objects for display
  const pendingPagesData = pendingRequestsData
    .filter((req: any) => req.status !== 'completed' && req.status !== 'rejected')
    .map((req: any) => ({
      page_id: `request-${req.requestId}`,
      facebook_page_id: req.requestId,
      page_name: req.pageName,
      page_url: req.pageDescription?.includes('URL:') ? req.pageDescription.replace('URL: ', '') : undefined,
      category: req.pageCategory || 'General',
      verification_status: 'pending' as const,
      status: 'inactive' as const,
      followers_count: 0,
      likes_count: 0,
      created_at: req.createdAt,
      updated_at: req.updatedAt,
      request_status: req.status as 'pending' | 'processing',
      is_request: true,
      bm_name: undefined,
      bm_id: undefined,
      business_manager_id: undefined
    }))

  // Combine both datasets
  const pages = [...activePagesData, ...pendingPagesData]
  const pagination = pagesData?.pagination || { total: 0, limit: 1, canAddMore: false }

  const handleRefresh = async () => {
    mutate()
    mutateRequests()
  }

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPageForm.facebook_page_id || !newPageForm.page_name) {
      toast.error('Facebook Page ID and name are required')
      return
    }

    try {
      const response = await fetch('/api/page-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          organization_id: currentOrganizationId,
          page_name: newPageForm.page_name,
          page_category: 'General', // Default category
          page_description: newPageForm.page_url ? `URL: ${newPageForm.page_url}` : undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit page request')
      }

      toast.success('Page request submitted successfully!', {
        description: 'Your page request is now under review and will be processed within 1-3 business days.'
      })
      setNewPageForm({ facebook_page_id: '', page_name: '', page_url: '' })
      setIsAddingPage(false)
      mutate() // Refresh active pages
      mutateRequests() // Refresh page requests
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit page request')
    }
  }

  const handleCancelPageRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/page-requests?request_id=${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel page request')
      }

      toast.success('Page request cancelled successfully')
      mutate() // Refresh active pages
      mutateRequests() // Refresh page requests
    } catch (error) {
      console.error('Error cancelling page request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel page request')
    }
  }

  // Filter pages based on search and status
  const filteredPages = useMemo(() => {
    let filtered = pages

    if (searchQuery) {
      filtered = filtered.filter(
        (page) =>
          page.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.facebook_page_id.includes(searchQuery) ||
          (page.bm_name && page.bm_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (page.bm_id && page.bm_id.includes(searchQuery))
      )
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        // Show pending requests
        filtered = filtered.filter(page => page.is_request && page.request_status === 'pending')
      } else if (statusFilter === "processing") {
        // Show processing requests
        filtered = filtered.filter(page => page.is_request && page.request_status === 'processing')
      } else {
        // Show active pages by status
        filtered = filtered.filter(page => !page.is_request && page.status === statusFilter)
      }
    }

    return filtered
  }, [pages, searchQuery, statusFilter])

  // Calculate metrics
  const activePages = pages.filter(page => !page.is_request && page.status === 'active').length
  const pendingRequests = pages.filter(page => page.is_request).length

  return (
    <div className="space-y-6">
      {/* Header - matching ad accounts design */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-12 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Active Pages
            </span>
            <div className="text-foreground font-semibold text-lg">
              {pagination.limit === -1 ? activePages : `${activePages} / ${pagination.limit}`}
            </div>
          </div>

          {pendingRequests > 0 && (
            <div className="flex flex-col">
              <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
                Pending Requests
              </span>
              <div className="text-yellow-600 font-semibold text-lg">
                {pendingRequests}
              </div>
            </div>
          )}
        </div>

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
                <DialogTitle className="text-xl">How to Add Facebook Pages</DialogTitle>
                <DialogDescription className="text-base">
                  Two ways to add pages to your Business Manager
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-base mb-3 text-foreground">New BM Applications</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Specify pages during BM application - we'll create them for you automatically.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-base mb-3 text-foreground">Existing Business Managers</h4>
                  <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside leading-relaxed">
                    <li className="pl-2">Go to Facebook Business Settings</li>
                    <li className="pl-2">Find "Pages" in the left menu</li>
                    <li className="pl-2">Click "Assign Partner" → "Business ID"</li>
                    <li className="pl-2">Enter your BM ID (from Business Managers list)</li>
                    <li className="pl-2">Select "Partial access (business tools and Facebook)"</li>
                  </ol>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddingPage} onOpenChange={setIsAddingPage}>
            <DialogTrigger asChild>
              <Button 
                disabled={!pagination.canAddMore}
                className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Facebook Page</DialogTitle>
              <DialogDescription>
                Add a Facebook page that will be available for your ad account applications.
                {!pagination.canAddMore && (
                  <span className="text-red-600 block mt-2">
                    You've reached your plan limit. Upgrade to add more pages.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPage} className="space-y-4">
              <div>
                <Label htmlFor="facebook_page_id">Facebook Page ID *</Label>
                <Input
                  id="facebook_page_id"
                  value={newPageForm.facebook_page_id}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, facebook_page_id: e.target.value }))}
                  placeholder="123456789012345"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Find this in your Facebook page settings under "Page Info"
                </p>
              </div>
              <div>
                <Label htmlFor="page_name">Page Name *</Label>
                <Input
                  id="page_name"
                  value={newPageForm.page_name}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, page_name: e.target.value }))}
                  placeholder="Your Page Name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="page_url">Page URL</Label>
                <Input
                  id="page_url"
                  value={newPageForm.page_url}
                  onChange={(e) => setNewPageForm(prev => ({ ...prev, page_url: e.target.value }))}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingPage(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Page
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search and Filters - matching ad accounts design */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pages, page IDs, or business managers..."
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
            <SelectItem value="suspended" className="text-popover-foreground hover:bg-accent">
              Suspended
            </SelectItem>
            <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
              Pending Request
            </SelectItem>
            <SelectItem value="processing" className="text-popover-foreground hover:bg-accent">
              Processing Request
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Refresh Button */}
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="h-9"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Page limit warnings */}
      {pagination.limit > 0 && activePages >= pagination.limit && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You've reached your page limit ({pagination.limit} pages). Upgrade your plan to add more pages.
          </AlertDescription>
        </Alert>
      )}

      {/* Zero pages allowed warning - only show after data has loaded */}
      {!isLoading && pagination.limit === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your current plan doesn't include Facebook pages. Upgrade your plan to add pages.
          </AlertDescription>
        </Alert>
      )}

      {/* Pages Table - matching ad accounts design */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        {/* Table Header */}
        <div
          className="grid gap-4 px-6 py-4 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide"
          style={{ gridTemplateColumns: "2fr 180px 1fr 180px 120px 150px" }}
        >
          <div className="flex items-center">PAGE</div>
          <div className="flex items-center">PAGE ID</div>
          <div className="flex items-center">BM NAME</div>
          <div className="flex items-center">BM ID</div>
          <div className="flex items-center">STATUS</div>
          <div className="flex items-center">ACTIONS</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border">
          {filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || statusFilter !== "all" ? "No pages match your filters" : "No Facebook pages found"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "Add your first Facebook page to get started"
                }
              </p>
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.page_id}
                className={`grid gap-4 px-6 py-5 transition-colors group border-b border-border ${
                  page.is_request 
                    ? 'cursor-default' 
                    : 'hover:bg-muted/50 cursor-pointer'
                }`}
                style={{ gridTemplateColumns: "2fr 180px 1fr 180px 120px 150px" }}
              >
                {/* Page */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-[#06b6d4]/20 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-[#8b5cf6]" />
                  </div>
                  <div className="min-w-0">
                    <div className={`font-medium flex items-center gap-2 ${
                      page.is_request ? 'text-muted-foreground' : 'text-foreground'
                    }`}>
                      <span className="truncate">
                        {page.page_name}
                      </span>
                      {page.is_request && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5 animate-pulse"></div>
                          Connection Pending
                        </span>
                      )}

                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {!page.is_request && page.followers_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{page.followers_count.toLocaleString()}</span>
                        </div>
                      )}
                      {!page.is_request && page.followers_count > 0 && page.likes_count > 0 && <span>•</span>}
                      {!page.is_request && page.likes_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{page.likes_count.toLocaleString()}</span>
                        </div>
                      )}
                      {page.is_request && (
                        <span>Awaiting connection</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Page ID */}
                <div className="flex items-center">
                  <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                    {page.facebook_page_id}
                  </div>
                </div>

                {/* BM Name */}
                <div className="flex items-center">
                  {page.bm_name ? (
                    <span className="text-sm text-foreground truncate">{page.bm_name}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {page.is_request ? 'Pending Assignment' : 'Not assigned'}
                    </span>
                  )}
                </div>

                {/* BM ID */}
                <div className="flex items-center">
                  {page.bm_id ? (
                    <div className="text-xs font-mono text-foreground bg-muted px-2 py-1 rounded border">
                      {page.bm_id}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {page.is_request ? 'Pending' : '-'}
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <StatusBadge 
                    status={page.is_request ? page.request_status as any : page.status as any} 
                    size="sm" 
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center">
                  {page.page_url && !page.is_request && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={page.page_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {page.is_request && page.request_status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelPageRequest(page.facebook_page_id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Results count - matching ad accounts */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredPages.length} of {pages.length} pages
      </div>

      {/* Upgrade prompt if at limit */}
      {!pagination.canAddMore && pages.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've reached your page limit. Upgrade your plan to add more Facebook pages. 
            Starter: 3 pages, Growth: 5 pages, Scale: 10 pages.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}