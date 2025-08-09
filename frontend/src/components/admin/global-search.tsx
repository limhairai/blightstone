"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../contexts/AuthContext"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Search, Building2, CreditCard, Users, ExternalLink } from "lucide-react"
import { cn } from "../../lib/utils"

interface SearchResult {
  id: string
  type: 'organization' | 'business_manager' | 'ad_account'
  name: string
  subtitle: string
  organization_name?: string
  status?: string
  href: string
  metadata?: any
}

interface GlobalSearchProps {
  trigger?: React.ReactNode
}

export function GlobalSearch({ trigger }: GlobalSearchProps) {
  const { session } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = async (searchQuery: string) => {
    if (!session?.access_token) return

    setLoading(true)
    try {
      const [orgsResponse, assetsResponse] = await Promise.all([
        // Search organizations
        fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        // Search assets (business managers and ad accounts)
        fetch('/api/admin/assets', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ])

      const searchResults: SearchResult[] = []

      // Process organizations
      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json()
        const organizations = orgsData.organizations || []
        
        organizations
          .filter((org: any) => 
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.organization_id.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 8)
          .forEach((org: any) => {
            searchResults.push({
              id: org.organization_id,
              type: 'organization',
              name: org.name,
              subtitle: `${org.business_managers_count || 0} BMs • ${((org.balance_cents || 0) / 100).toFixed(2)} balance • ID: ${org.organization_id.slice(0, 8)}`,
              href: `/admin/organizations/${org.organization_id}`,
              status: org.subscription_status || 'active'
            })
          })
      }

      // Process assets (business managers and ad accounts)
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json()
        const assets = assetsData.assets || []
        
        assets
          .filter((asset: any) => 
            asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.dolphin_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            asset.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 12)
          .forEach((asset: any) => {
            if (asset.type === 'business_manager') {
              searchResults.push({
                id: asset.asset_id,
                type: 'business_manager',
                name: asset.name,
                subtitle: `${asset.organization_name} • ${asset.ad_accounts_count || 0} ad accounts`,
                organization_name: asset.organization_name,
                href: `/admin/organizations/${asset.organization_id}/business-managers/${asset.dolphin_id}`,
                status: asset.status
              })
            } else if (asset.type === 'ad_account') {
              // Convert spend_cap from cents to dollars (Dolphin API returns cents)
              const spendCapCents = asset.metadata?.spend_cap || 0;
              const spendCap = spendCapCents / 100;
              const amountSpent = asset.metadata?.amount_spent || 0;
              const balance = spendCap - amountSpent;
              searchResults.push({
                id: asset.asset_id,
                type: 'ad_account',
                name: asset.name,
                subtitle: `${asset.organization_name} • ${balance.toFixed(2)} balance`,
                organization_name: asset.organization_name,
                href: `/admin/organizations/${asset.organization_id}`,
                status: asset.status,
                metadata: { dolphin_id: asset.dolphin_id }
              })
            }
          })
      }

      // Sort results: organizations first, then BMs, then ad accounts
      const sortedResults = searchResults.sort((a, b) => {
        const typeOrder = { organization: 0, business_manager: 1, ad_account: 2 }
        return typeOrder[a.type] - typeOrder[b.type]
      })

      setResults(sortedResults.slice(0, 20)) // Limit to 20 results
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'organization':
        return <Building2 className="h-4 w-4" />
      case 'business_manager':
        return <Users className="h-4 w-4" />
      case 'ad_account':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getResultBadge = (type: string) => {
    switch (type) {
      case 'organization':
        return <Badge variant="outline" className="text-xs">Organization</Badge>
      case 'business_manager':
        return <Badge variant="secondary" className="text-xs">Business Manager</Badge>
      case 'ad_account':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-foreground">Ad Account</Badge>
      default:
        return null
    }
  }

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full justify-start text-muted-foreground hover:bg-[#F5F5F5]/50 border-border/50 bg-background/50 backdrop-blur-sm"
        >
          <Search className="h-4 w-4 mr-3 text-muted-foreground/70" />
          <span className="text-sm">Search organizations, accounts...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/80">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              <Search className="h-4 w-4" />
              Global Search
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            <Input
              placeholder="Search organizations, business managers, ad accounts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full"
              autoFocus
            />
          </div>

          {query.length >= 2 && (
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Searching...
                </div>
              )}
              
              {!loading && results.length === 0 && query.length >= 2 && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results found for &quot;{query}&quot;
                </div>
              )}
              
              {!loading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                        index === selectedIndex && "bg-muted"
                      )}
                      onClick={() => handleSelect(result)}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium truncate">{result.name}</div>
                          {getResultBadge(result.type)}
                          {result.status && (
                            <Badge 
                              variant={result.status === 'active' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {result.status}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                          {result.metadata?.dolphin_id && (
                            <span className="ml-2 font-mono">ID: {result.metadata.dolphin_id}</span>
                          )}
                        </div>
                      </div>
                      
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {query.length < 2 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Keyboard shortcut hook
export function useGlobalSearchShortcut() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { open, setOpen }
} 