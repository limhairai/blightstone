"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminDataTable } from '@/components/admin/admin-data-table'
import { Loader2, RefreshCw, ExternalLink, Users, Heart, Verified, AlertCircle, FileText, Building2, Search, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { BindAssetDialog } from "../../../components/admin/BindAssetDialog"

interface DolphinPage {
  id: string
  type: 'facebook_page'
  dolphin_id: string
  name: string
  status: 'active' | 'inactive' | 'suspended'
  metadata: {
    page_url?: string
    category?: string
    followers_count: number
    likes_count: number
    verification_status: 'verified' | 'unverified' | 'pending'
    managing_profile?: string
    parent_bm_id?: string
    parent_bm_name?: string
    facebook_page_id: string
  }
  last_synced_at: string
  organization_name?: string
  business_name?: string
  organization_id?: string
  bound_at?: string
}

export default function AdminPagesPage() {
  const { session } = useAuth()
  const [pages, setPages] = useState<DolphinPage[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bindingFilter, setBindingFilter] = useState('all')

  const loadPages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/dolphin-assets/all-assets`)
      if (!response.ok) throw new Error(`Failed to load pages: ${response.statusText}`)
      const data = await response.json()
      
      // Handle both old format (array) and new format ({assets: array})
      const assetsArray = Array.isArray(data) ? data : (data.assets || [])
      // Filter only facebook_page assets
      const pagesArray = assetsArray.filter((asset: any) => asset.type === 'facebook_page')
      setPages(pagesArray)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages')
      toast.error("Failed to load pages. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  const syncAssets = useCallback(async (forceRefresh = false) => {
    setSyncing(true)
    try {
      const response = await fetch(`/api/admin/dolphin-assets/sync/discover${forceRefresh ? '?force_refresh=true' : ''}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to sync assets')
      
      const result = await response.json()
      toast.success(`Sync completed! Found ${result.pages_found || 0} pages`)
      await loadPages() // Reload data after sync
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sync assets')
    } finally {
      setSyncing(false)
    }
  }, [session?.access_token, loadPages])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  // Filter and search logic
  const filteredPages = useMemo(() => {
    return pages.filter(page => {
      const matchesSearch = !searchTerm || 
        page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.dolphin_id.includes(searchTerm) ||
        page.metadata.managing_profile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || page.status === statusFilter
      const matchesBinding = bindingFilter === 'all' || 
        (bindingFilter === 'bound' && page.organization_id) ||
        (bindingFilter === 'unbound' && !page.organization_id)
      
      return matchesSearch && matchesStatus && matchesBinding
    })
  }, [pages, searchTerm, statusFilter, bindingFilter])

  // Stats calculations
  const stats = useMemo(() => {
    return {
      total: pages.length,
      active: pages.filter(p => p.status === 'active').length,
      verified: pages.filter(p => p.metadata.verification_status === 'verified').length,
      bound: pages.filter(p => p.organization_id).length,
      totalFollowers: pages.reduce((sum, p) => sum + (p.metadata.followers_count || 0), 0)
    }
  }, [pages])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load pages</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadPages} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Facebook Pages</h1>
          <p className="text-gray-600">Manage Facebook pages discovered from Dolphin Cloud</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => syncAssets(false)} variant="outline" disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Pages'}
          </Button>
          <Button onClick={() => syncAssets(true)} variant="outline" disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Force Sync
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <Verified className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bound</CardTitle>
            <LinkIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bound}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
            <Heart className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search pages, IDs, profiles, or organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={bindingFilter} onValueChange={setBindingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Binding" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="bound">Bound</SelectItem>
            <SelectItem value="unbound">Unbound</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages Table */}
      <div className="text-sm text-muted-foreground mb-4">
        {filteredPages.length} pages total
      </div>

      <AdminDataTable
        data={filteredPages}
        columns={[
          {
            key: 'name',
            label: 'Facebook Page',
            render: (value, item) => (
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#4267B2]/20 to-[#1877F2]/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-[#4267B2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate flex items-center gap-2">
                    {value}
                    {(item as DolphinPage).metadata.verification_status === 'verified' && (
                      <Verified className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    ID: {(item as DolphinPage).dolphin_id} • {(item as DolphinPage).metadata.category || 'No category'}
                  </div>
                </div>
              </div>
            ),
            width: 220
          },
          {
            key: 'status',
            label: 'Status',
            render: (value) => {
              const variants = {
                active: 'bg-green-100 text-green-800',
                inactive: 'bg-gray-100 text-gray-800',
                suspended: 'bg-red-100 text-red-800'
              }
              return (
                <Badge className={variants[value as keyof typeof variants] || variants.inactive}>
                  {value?.charAt(0).toUpperCase() + value?.slice(1)}
                </Badge>
              )
            },
            width: 100
          },
          {
            key: 'metadata.managing_profile',
            label: 'Team',
            render: (value) => (
              <div className="truncate text-sm">{value || 'Unknown'}</div>
            ),
            width: 120
          },
          {
            key: 'metadata.parent_bm_name',
            label: 'Parent BM',
            render: (value) => (
              <div className="truncate text-sm">{value || 'No BM'}</div>
            ),
            width: 120
          },
          {
            key: 'metadata.followers_count',
            label: 'Followers',
            render: (value) => (
              <div className="text-center font-medium">
                {typeof value === 'number' ? value.toLocaleString() : '0'}
              </div>
            ),
            sortable: true,
            width: 100
          },
          {
            key: 'metadata.likes_count',
            label: 'Likes',
            render: (value) => (
              <div className="text-center font-medium">
                {typeof value === 'number' ? value.toLocaleString() : '0'}
              </div>
            ),
            sortable: true,
            width: 100
          },
          {
            key: 'organization_name',
            label: 'Bound To',
            render: (value, item) => {
              if (!value) {
                return (
                  <BindAssetDialog 
                    asset={item as any}
                    onSuccess={loadPages}
                  >
                    <Button variant="outline" size="sm">
                      Bind
                    </Button>
                  </BindAssetDialog>
                )
              }
              return (
                <div className="flex items-center gap-1 min-w-0">
                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate text-sm">{value}</span>
                </div>
              )
            },
            width: 140
          },
          {
            key: 'last_synced_at',
            label: 'Last Sync',
            render: (value) => (
              <div className="text-xs text-muted-foreground">
                {value ? new Date(value).toLocaleString() : 'Never'}
              </div>
            ),
            sortable: true,
            width: 120
          },
          {
            key: 'actions',
            label: 'Actions',
            render: (_, item) => (
              <div className="flex items-center gap-1">
                {(item as DolphinPage).metadata.page_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={(item as DolphinPage).metadata.page_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ),
            width: 80
          }
        ]}
        emptyMessage="No Facebook pages found. Try syncing assets to discover pages from Dolphin Cloud."
      />
    </div>
  )
}