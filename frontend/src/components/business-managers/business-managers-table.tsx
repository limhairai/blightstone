"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import { BusinessManagersViewToggle } from "@/components/business-managers/business-managers-view-toggle"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/utils/format"
import { Search, ArrowRight, Building2, Copy, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BusinessManager } from "@/types/business"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface BusinessManagersTableProps {
  businessManagers: BusinessManager[]
  loading: boolean
  onRefresh: () => void
}

export function BusinessManagersTable({ businessManagers, loading, onRefresh }: BusinessManagersTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("list")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState<BusinessManager | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

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

  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(bmId)
    toast.success("Business Manager ID copied to clipboard!")
  }

  const handleDeleteManager = async () => {
    if (!managerToDelete) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/business-managers?id=${managerToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete Business Manager');
      }
      setDeleteDialogOpen(false)
      setManagerToDelete(null)
      onRefresh()
      toast.success("Business Manager deleted successfully!")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error("Deletion Failed", { description: errorMessage });
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (manager: BusinessManager, e: React.MouseEvent) => {
    e.stopPropagation()
    setManagerToDelete(manager)
    setDeleteDialogOpen(true)
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
        /* Grid View */
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredManagers.map((manager) => (
            <div
              key={manager.id}
              onClick={(e) => handleManagerClick(manager, e)}
              className={cn(
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 group",
                "hover:shadow-md hover:border-border/60 hover:bg-card/80",
                manager.status === "active" 
                  ? "cursor-pointer hover:border-[#c4b5fd]/30" 
                  : "cursor-not-allowed opacity-60",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                    <span className="text-white font-semibold">{getManagerInitial(manager.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{manager.name}</h3>
                      <StatusBadge status={manager.status as any} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {manager.is_application ? 'Application' : 'Business Manager'}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-accent dropdown-trigger"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {manager.dolphin_business_manager_id && (
                          <DropdownMenuItem onClick={(e) => copyBmId(manager.dolphin_business_manager_id!, e)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy BM ID
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => openDeleteDialog(manager, e)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* BM ID - Always reserve space for alignment */}
              <div className="mb-3 flex items-center min-h-[24px]">
                {manager.dolphin_business_manager_id ? (
                  <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-xs text-muted-foreground">
                    <span>BM ID:</span>
                    <code className="text-xs">{manager.dolphin_business_manager_id}</code>
                    <button
                      onClick={(e) => copyBmId(manager.dolphin_business_manager_id!, e)}
                      className="p-0.5 hover:bg-accent rounded transition-colors ml-1"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Ad Accounts</div>
                  <div className="font-semibold text-foreground text-lg">{manager.ad_account_count || 0}</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="font-semibold text-foreground text-sm capitalize">{manager.status}</div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
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
                  : "cursor-not-allowed opacity-60",
              )}
            >
              <div className="flex items-center justify-between">
                {/* Left: Manager Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                    <span className="text-white font-semibold">{getManagerInitial(manager.name)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{manager.name}</h3>
                      <StatusBadge status={manager.status as any} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{manager.is_application ? 'Application' : 'Business Manager'}</span>
                      <span>•</span>
                      <span>Created {new Date(manager.created_at).toLocaleDateString()}</span>
                      {manager.dolphin_business_manager_id && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">{manager.dolphin_business_manager_id}</code>
                            <button
                              onClick={(e) => copyBmId(manager.dolphin_business_manager_id!, e)}
                              className="p-0.5 hover:bg-accent rounded transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics and Actions */}
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center justify-center w-24">
                    <div className="text-xs text-muted-foreground mb-1">Ad Accounts</div>
                    <div className="font-semibold text-foreground text-lg">{manager.ad_account_count || 0}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 dropdown-trigger" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {manager.dolphin_business_manager_id && (
                          <DropdownMenuItem onClick={(e) => copyBmId(manager.dolphin_business_manager_id!, e)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy BM ID
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => openDeleteDialog(manager, e)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredManagers.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No business managers found</h3>
          <p className="text-muted-foreground mb-4">
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

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the Business Manager record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteManager}
              disabled={actionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 