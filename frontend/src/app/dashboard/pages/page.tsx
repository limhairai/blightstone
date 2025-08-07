"use client"

import { useState, useEffect } from 'react'
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
  Verified, 
  AlertCircle,
  Facebook,
  Loader2,
  RefreshCw,
  Info
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
}

interface PagesResponse {
  pages: FacebookPage[]
  pagination: {
    total: number
    limit: number
    canAddMore: boolean
  }
}

export default function PagesPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [newPageForm, setNewPageForm] = useState({
    facebook_page_id: '',
    page_name: '',
    page_url: '',
    category: ''
  })

  // Fetch pages data
  const { data: pagesData, error, isLoading, mutate } = useSWR<PagesResponse>(
    session?.access_token && currentOrganizationId 
      ? [`/api/pages?organization_id=${currentOrganizationId}`, session.access_token]
      : null,
    ([url, token]) => authenticatedFetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  )

  const pages = pagesData?.pages || []
  const pagination = pagesData?.pagination || { total: 0, limit: 1, canAddMore: false }

  const handleRefresh = async () => {
    mutate()
  }

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPageForm.facebook_page_id || !newPageForm.page_name) {
      toast.error('Facebook Page ID and name are required')
      return
    }

    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...newPageForm,
          organization_id: currentOrganizationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add page')
      }

      toast.success('Facebook page added successfully')
      setNewPageForm({ facebook_page_id: '', page_name: '', page_url: '', category: '' })
      setIsAddingPage(false)
      mutate() // Refresh the data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add page')
    }
  }

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

  // Calculate metrics
  const activePages = pages.filter(page => page.status === 'active').length
  const verifiedPages = pages.filter(page => page.verification_status === 'verified').length

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex items-center justify-between">
        {/* Left: Metrics */}
        <div className="flex items-start gap-12 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Active Pages
            </span>
            <div className="text-foreground font-semibold text-lg">
              {pagination.limit === -1 ? activePages : `${activePages} / ${pagination.limit}`}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium mb-1">
              Verified Pages
            </span>
            <div className="text-foreground font-semibold text-lg">
              {verifiedPages}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Dialog open={isAddingPage} onOpenChange={setIsAddingPage}>
            <DialogTrigger asChild>
              <Button disabled={!pagination.canAddMore}>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
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
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newPageForm.category} onValueChange={(value) => setNewPageForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="brand">Brand</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="nonprofit">Non-profit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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

      {/* Pages Table */}
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Facebook className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Facebook pages found</h3>
          <p className="text-sm text-muted-foreground">
            Add your first Facebook page to get started
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Page</TableHead>
                <TableHead className="w-[150px]">Page ID</TableHead>
                <TableHead className="w-[200px]">BM Name</TableHead>
                <TableHead className="w-[150px]">BM ID</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => (
                <TableRow key={page.page_id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1877f2]/20 to-[#42a5f5]/20 flex items-center justify-center">
                        <Facebook className="h-4 w-4 text-[#1877f2]" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {page.page_name}
                          {page.verification_status === 'verified' && (
                            <Verified className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {page.category && <span>{page.category}</span>}
                          {page.category && (page.followers_count > 0 || page.likes_count > 0) && <span>•</span>}
                          {page.followers_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{page.followers_count.toLocaleString()}</span>
                            </div>
                          )}
                          {page.likes_count > 0 && (
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{page.likes_count.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {page.facebook_page_id}
                    </code>
                  </TableCell>
                  <TableCell>
                    {page.bm_name ? (
                      <span className="text-foreground">{page.bm_name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {page.bm_id ? (
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {page.bm_id}
                      </code>
                    ) : (
                      <span className="text-muted-foreground italic">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={page.status as any} 
                      size="sm" 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {page.page_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={page.page_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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