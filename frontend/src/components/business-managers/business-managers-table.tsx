"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { BusinessManagersViewToggle } from "@/components/business-managers/business-managers-view-toggle"
import { BmCardWithTabs } from "@/components/business-managers/bm-card-with-tabs"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/utils/format"
import { Search, ArrowRight, Building2, Loader2, X, Trash2, MoreHorizontal, Copy, Power, PowerOff, Globe, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { BusinessManager } from "@/types/business"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { mutate } from "swr"
import { AssetDeactivationDialog } from "@/components/dashboard/AssetDeactivationDialog"
import { useAssetDeactivation } from "@/hooks/useAssetDeactivation"
import { BmDetailsDialog } from "@/components/business-managers/bm-details-dialog"

interface BusinessManagersTableProps {
  businessManagers: any[]
  loading: boolean
  onRefresh: () => void
}

export function BusinessManagersTable({ businessManagers, loading, onRefresh }: BusinessManagersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("list")
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  
  // Add deactivation state
  const [deactivationDialog, setDeactivationDialog] = useState<{
    open: boolean;
    asset: any | null;
  }>({ open: false, asset: null });

  // Add details dialog state
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    businessManager: BusinessManager | null;
  }>({ open: false, businessManager: null });

  const { session } = useAuth()
  const router = useRouter()
  
  // Add deactivation handler
  const handleDeactivationClick = (manager: BusinessManager, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeactivationDialog({
      open: true,
      asset: {
        id: manager.id,
        asset_id: manager.asset_id || manager.id,
        name: manager.name,
        type: 'business_manager',
        is_active: manager.is_active !== false
      }
    });
  }
  
  // Add copy function
  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bmId) {
      navigator.clipboard.writeText(bmId);
      toast.success('Business Manager ID copied to clipboard');
    }
  }

  // Add view details handler
  const handleViewDetails = (businessManager: BusinessManager, e: React.MouseEvent) => {
    e.stopPropagation()
    setDetailsDialog({ open: true, businessManager })
  }

  const filteredManagers = useMemo(() => {
    let filtered = businessManagers

    if (searchQuery) {
      filtered = filtered.filter(
        (manager) =>
          manager.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (manager.dolphin_business_manager_id && manager.dolphin_business_manager_id.includes(searchQuery)),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((manager) => manager.status === statusFilter)
    }

    // Sort business managers
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "activity":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "accounts":
          return (b.ad_account_count || 0) - (a.ad_account_count || 0)
        default:
          return 0
      }
    })
  }, [businessManagers, searchQuery, statusFilter, sortBy])

  const handleManagerClick = (manager: BusinessManager, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest('[role="dialog"]') ||
      target.closest("a") ||
      target.closest(".dropdown-trigger")
    ) {
      return
    }

    // Only navigate if active and has ID
    if (manager.status === "active" && manager.id) {
      router.push(`/dashboard/accounts?bm_id=${encodeURIComponent(manager.id)}`)
    }
  }

  const getManagerInitial = (name: string) => {
    return getInitials(name)
  }

  const handleCancelApplication = async (manager: BusinessManager, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    
    if (!session?.access_token) {
      toast.error('Authentication required')
      return
    }
    
    if (!manager.application_id) {
      toast.error('Application ID not found')
      return
    }
    
    setCancellingId(manager.id)
    
    try {
      const response = await fetch(`/api/applications/${manager.application_id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel application')
      }
      
      const result = await response.json()
      
      if (manager.status === 'rejected') {
        toast.success('Application deleted successfully')
      } else {
        toast.success('Application cancelled successfully')
      }
      
      // Refresh the data
      onRefresh()
      
    } catch (error) {
      console.error('Error cancelling application:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel application')
    } finally {
      setCancellingId(null)
    }
  }

  const getActionButtons = (manager: BusinessManager) => {
    // For applications, show cancel/delete buttons
    if (manager.is_application) {
      const canCancel = ['pending', 'processing'].includes(manager.status)
      const canDelete = manager.status === 'rejected'
      
      if (!canCancel && !canDelete) {
        return null
      }
      
      const isProcessing = cancellingId === manager.id
      
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                handleCancelApplication(manager, e)
              }}
              disabled={isProcessing}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className="ml-1">Cancel</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleCancelApplication(manager, e)}
              disabled={isProcessing}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-muted-foreground border-border hover:bg-red-50 dark:text-muted-foreground dark:border-border dark:hover:bg-muted/20"
            >
              {isProcessing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span className="ml-1">Delete</span>
            </Button>
          )}
        </div>
      )
    }
    
    // For active business managers, show dropdown menu
    if (manager.status === 'active') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => handleViewDetails(manager, e)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => copyBmId(manager.dolphin_business_manager_id || '', e)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy BM ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => handleDeactivationClick(manager, e)}
              className="text-muted-foreground"
            >
              {manager.is_active === false ? (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Activate
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Deactivate
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    
    // For other statuses, show view details button
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => handleViewDetails(manager, e)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Eye className="h-3 w-3 mr-1" />
        Details
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search business managers or BM ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-background border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
                All Statuses
              </SelectItem>
              <SelectItem value="active" className="text-popover-foreground hover:bg-accent">
                Active
              </SelectItem>
              <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
                Pending
              </SelectItem>
              <SelectItem value="processing" className="text-popover-foreground hover:bg-accent">
                Processing
              </SelectItem>
              <SelectItem value="rejected" className="text-popover-foreground hover:bg-accent">
                Rejected
              </SelectItem>
              <SelectItem value="suspended" className="text-popover-foreground hover:bg-accent">
                Suspended
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-10 bg-background border-border text-foreground">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="activity" className="text-popover-foreground hover:bg-accent">
                Last Activity
              </SelectItem>
              <SelectItem value="name" className="text-popover-foreground hover:bg-accent">
                Name
              </SelectItem>
              <SelectItem value="accounts" className="text-popover-foreground hover:bg-accent">
                Ad Accounts
              </SelectItem>
            </SelectContent>
          </Select>

          <BusinessManagersViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === "grid" ? (
        /* Grid View with Tabs */
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredManagers.map((manager) => (
            <BmCardWithTabs
              key={manager.id}
              manager={manager}
              onDeactivationClick={handleDeactivationClick}
              getActionButtons={getActionButtons}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredManagers.map((manager) => (
            <div
              key={manager.id}
              onClick={(e) => handleManagerClick(manager, e)}
              className={cn(
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 group",
                "hover:shadow-md hover:border-border/60 hover:bg-card/80",
                manager.status === "active" 
                  ? "cursor-pointer hover:border-[#c4b5fd]/30" 
                  : "cursor-default",
                manager.is_active === false && "opacity-50 grayscale"
              )}
            >
              <div className="flex items-center justify-between">
                {/* Left: Manager Info with Domains */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground truncate">{manager.name}</h3>
                    <div className="flex items-center gap-2">
                      {manager.is_active === false ? (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          Deactivated
                        </span>
                      ) : (
                        <StatusBadge status={manager.status as any} size="sm" />
                      )}
                    </div>
                  </div>
                  {/* Domains under name */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    {manager.domains && manager.domains.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {manager.domains.slice(0, 4).map((domain: string, index: number) => (
                          <div 
                            key={index} 
                            className="inline-flex items-center px-2 py-1 bg-muted/40 rounded text-xs"
                            title={domain}
                          >
                            <span className="truncate max-w-[120px]">{domain}</span>
                          </div>
                        ))}
                        {manager.domains.length > 4 && (
                          <div className="inline-flex items-center px-2 py-1 bg-muted/20 rounded text-xs text-muted-foreground">
                            +{manager.domains.length - 4} more
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic">No domains</div>
                    )}
                  </div>
                  {/* Application type if applicable */}
                  {manager.is_application && (
                    <div className="text-xs text-muted-foreground">
                      Application
                    </div>
                  )}
                </div>

                {/* Right: Columns for Date, BM ID, Ad Accounts, Actions */}
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-start justify-center w-24">
                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                    <div className="text-sm text-foreground">{new Date(manager.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-start justify-center w-32">
                    <div className="text-xs text-muted-foreground mb-1">BM ID</div>
                    <div className="text-sm text-foreground">
                      {manager.dolphin_business_manager_id ? (
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          {manager.dolphin_business_manager_id}
                        </code>
                      ) : (
                        <span className="text-muted-foreground italic">Not assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-20">
                    <div className="text-xs text-muted-foreground mb-1">Ad Accounts</div>
                    <div className="font-semibold text-foreground text-lg">{manager.ad_account_count || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getActionButtons(manager)}
                    {manager.status === "active" && (
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredManagers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">No business managers found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by applying for your first business manager"}
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredManagers.length} of {businessManagers.length} business managers
      </div>
      
      {/* Deactivation Dialog */}
      {deactivationDialog.asset && (
        <AssetDeactivationDialog
          asset={{
            id: deactivationDialog.asset.id,
            asset_id: deactivationDialog.asset.asset_id || deactivationDialog.asset.id,
            name: deactivationDialog.asset.name,
            type: 'business_manager',
            is_active: deactivationDialog.asset.is_active !== false
          }}
          open={deactivationDialog.open}
          onOpenChange={(open) => setDeactivationDialog({ open, asset: open ? deactivationDialog.asset : null })}
          onSuccess={onRefresh}
        />
      )}

      {/* BM Details Dialog */}
      <BmDetailsDialog
        businessManager={detailsDialog.businessManager}
        open={detailsDialog.open}
        onOpenChange={(open) => setDetailsDialog({ open, businessManager: open ? detailsDialog.businessManager : null })}
      />
    </div>
  )
} 