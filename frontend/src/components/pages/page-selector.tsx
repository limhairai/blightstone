"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { usePages } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Facebook,
  Verified, 
  AlertCircle,
  X,
  ExternalLink
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
  business_manager_id?: string // BM this page belongs to
}

interface PageSelectorProps {
  selectedPageIds: string[]
  onPageSelection: (pageIds: string[]) => void
  maxPages?: number
  required?: boolean
  className?: string
  businessManagerId?: string // Filter pages by BM
  showCreateOption?: boolean // Show/hide create new page option
}

export function PageSelector({ 
  selectedPageIds, 
  onPageSelection, 
  maxPages = 3, 
  required = true,
  className,
  businessManagerId,
  showCreateOption = true
}: PageSelectorProps) {
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
  const { data: pagesData, error, isLoading, mutate } = usePages(currentOrganizationId)
  const allPages = pagesData?.pages || []
  const canAddMore = pagesData?.pagination?.canAddMore ?? false

  // Filter pages by business manager if specified
  const pages = businessManagerId 
    ? allPages.filter((page: FacebookPage) => page.business_manager_id === businessManagerId)
    : allPages

  const selectedPages = pages.filter((page: FacebookPage) => selectedPageIds.includes(page.page_id))

  const handlePageToggle = (pageId: string, checked: boolean) => {
    if (checked) {
      if (selectedPageIds.length < maxPages) {
        onPageSelection([...selectedPageIds, pageId])
      } else {
        toast.error(`You can only select up to ${maxPages} pages`)
      }
    } else {
      onPageSelection(selectedPageIds.filter(id => id !== pageId))
    }
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

      const result = await response.json()
      toast.success('Facebook page added successfully')
      setNewPageForm({ facebook_page_id: '', page_name: '', page_url: '', category: '' })
      setIsAddingPage(false)
      mutate() // Refresh the data
      
      // Auto-select the new page if under limit
      if (selectedPageIds.length < maxPages) {
        onPageSelection([...selectedPageIds, result.page.page_id])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add page')
    }
  }

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <Verified className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const removeSelectedPage = (pageId: string) => {
    onPageSelection(selectedPageIds.filter(id => id !== pageId))
  }

  if (isLoading) {
    return (
      <div className={className}>
        <Label>Facebook Pages {required && '*'}</Label>
        <div className="animate-pulse space-y-2 mt-2">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Label>Facebook Pages {required && '*'}</Label>
        <span className="text-sm text-muted-foreground">
          {selectedPageIds.length}/{maxPages} selected
        </span>
      </div>

      {/* Selected Pages */}
      {selectedPages.length > 0 && (
        <div className="space-y-2 mb-4">
          {selectedPages.map((page: FacebookPage) => (
            <div key={page.page_id} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50/50">
              <div className="flex items-center space-x-3">
                <Facebook className="h-4 w-4 text-blue-600" />
                {getVerificationIcon(page.verification_status)}
                <div>
                  <div className="font-medium">{page.page_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {page.followers_count.toLocaleString()} followers
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSelectedPage(page.page_id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Available Pages */}
      {pages.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Available Pages</CardTitle>
            <CardDescription className="text-xs">
              Select up to {maxPages} Facebook pages for this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.map((page: FacebookPage) => (
              <div key={page.page_id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                <Checkbox
                  checked={selectedPageIds.includes(page.page_id)}
                  onCheckedChange={(checked) => handlePageToggle(page.page_id, checked as boolean)}
                  disabled={!selectedPageIds.includes(page.page_id) && selectedPageIds.length >= maxPages}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  {getVerificationIcon(page.verification_status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{page.page_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {page.followers_count.toLocaleString()} followers • {page.category || 'No category'}
                    </div>
                  </div>
                  {page.page_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={page.page_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Facebook className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              {businessManagerId 
                ? "No Facebook pages found for this Business Manager. Pages need to be created during the BM application process."
                : "No Facebook pages found. Add your first page to continue."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Page Button - Only show if showCreateOption is true */}
      {showCreateOption && (
        <Dialog open={isAddingPage} onOpenChange={setIsAddingPage}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mt-3" 
              disabled={!canAddMore}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Page
            </Button>
          </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Facebook Page</DialogTitle>
            <DialogDescription>
              Add a new Facebook page to your organization.
              {!canAddMore && (
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
      )}

      {required && selectedPageIds.length === 0 && (
        <p className="text-sm text-red-600 mt-2">
          At least one Facebook page is required for this application.
        </p>
      )}
    </div>
  )
}