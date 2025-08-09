'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Globe, Plus, Trash2, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface Domain {
  domain_id: string
  domain_url: string
  created_at: string
  is_active: boolean
}

interface DomainLimits {
  current: number
  max: number
  canAddMore: boolean
}

interface BmInfo {
  id: string
  name: string
}

interface BmDomainsTabProps {
  bmId: string
  bmName: string
}

export function BmDomainsTab({ bmId, bmName }: BmDomainsTabProps) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [limits, setLimits] = useState<DomainLimits>({ current: 0, max: 0, canAddMore: false })
  const [bmInfo, setBmInfo] = useState<BmInfo>({ id: bmId, name: bmName })
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newDomainUrl, setNewDomainUrl] = useState('')
  const [deletingDomainId, setDeletingDomainId] = useState<string | null>(null)
  const { session } = useAuth()

  const fetchDomains = async () => {
    if (!session?.access_token) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/business-managers/${bmId}/domains`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch domains')
      }

      const data = await response.json()
      setDomains(data.domains || [])
      setLimits(data.limits || { current: 0, max: 0, canAddMore: false })
      setBmInfo(data.bmInfo || { id: bmId, name: bmName })
    } catch (error) {
      console.error('Error fetching domains:', error)
      toast.error('Failed to load domains')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomainUrl.trim() || !session?.access_token) return

    try {
      setIsAddingDomain(true)
      const response = await fetch(`/api/business-managers/${bmId}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          domain_url: newDomainUrl.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add domain')
      }

      const data = await response.json()
      toast.success('Domain added successfully')
      setNewDomainUrl('')
      setAddDialogOpen(false)
      fetchDomains() // Refresh the list
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add domain')
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!session?.access_token) return

    try {
      setDeletingDomainId(domainId)
      const response = await fetch(`/api/business-managers/${bmId}/domains/${domainId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete domain')
      }

      toast.success('Domain removed successfully')
      fetchDomains() // Refresh the list
    } catch (error) {
      console.error('Error deleting domain:', error)
      toast.error('Failed to remove domain')
    } finally {
      setDeletingDomainId(null)
    }
  }

  const formatUrl = (url: string) => {
    // Add protocol if missing for display
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  const getDomainDisplayName = (url: string) => {
    // Remove protocol for cleaner display
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  useEffect(() => {
    fetchDomains()
  }, [bmId, session])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading domains...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with limits and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Domains</span>
          <Badge variant="secondary" className="text-xs">
            {limits.current} / {limits.max === -1 ? '∞' : limits.max}
          </Badge>
          {limits.max !== -1 && !limits.canAddMore && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {limits.max !== -1 && limits.canAddMore && limits.max - limits.current <= 2 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {limits.max - limits.current} remaining
            </Badge>
          )}
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={!limits.canAddMore}
              className="flex items-center gap-1 disabled:opacity-50"
              title={!limits.canAddMore ? 'Domain limit reached for your plan' : 'Add a new domain'}
            >
              <Plus className="h-3 w-3" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Domain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain-url">Domain URL</Label>
                <Input
                  id="domain-url"
                  placeholder="example.com or https://example.com"
                  value={newDomainUrl}
                  onChange={(e) => setNewDomainUrl(e.target.value)}
                  disabled={isAddingDomain}
                />
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Enter the domain you want to associate with this Business Manager
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usage: {limits.current} / {limits.max === -1 ? '∞' : limits.max} domains
                    {limits.max !== -1 && ` (${limits.max - limits.current} remaining)`}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  disabled={isAddingDomain}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDomain}
                  disabled={!newDomainUrl.trim() || isAddingDomain}
                >
                  {isAddingDomain ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add Domain'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Limit reached message */}
      {!limits.canAddMore && limits.max !== -1 && (
        <div className="text-xs text-muted-foreground bg-orange-50 dark:bg-muted/20 border border-border dark:border-border p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground dark:text-muted-foreground">Domain limit reached</p>
              <p className="text-muted-foreground dark:text-muted-foreground">
                You've used all {limits.max} domains allowed for your plan. Upgrade to add more domains per Business Manager.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Domains list */}
      <div className="space-y-2">
        {domains.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No domains added yet</p>
            <p className="text-xs">Add a domain to get started</p>
          </div>
        ) : (
          domains.map((domain) => (
            <div
              key={domain.domain_id}
              className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-muted/40"
            >
              <div className="flex items-center gap-2 flex-1">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getDomainDisplayName(domain.domain_url)}
                    </span>
                    <a
                      href={formatUrl(domain.domain_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(domain.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteDomain(domain.domain_id)}
                disabled={deletingDomainId === domain.domain_id}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                {deletingDomainId === domain.domain_id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 