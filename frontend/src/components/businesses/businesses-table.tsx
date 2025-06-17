"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { StatusBadge } from "../ui/status-badge"
import { EditBusinessDialog } from "../dashboard/edit-business-dialog"
import { BusinessesViewToggle } from "./businesses-view-toggle"
import { Button } from "../ui/button"
import { type MockBusiness, getInitials, formatCurrency } from "../../lib/mock-data"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { Search, ArrowRight, Building2, Copy, Edit, MoreHorizontal, Trash2, CheckCircle, XCircle } from "lucide-react"
import { cn } from "../../lib/utils"
import { useDemoState } from "../../contexts/DemoStateContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog"

export function BusinessesTable() {
  const { state, deleteBusiness, approveBusiness } = useDemoState()
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("list")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [businessToDelete, setBusinessToDelete] = useState<MockBusiness | null>(null)
  const router = useRouter()

  // Use real-time data from demo state
  const businesses = state.businesses

  // Determine the current theme mode for avatar classes
  const currentMode = theme === "light" ? "light" : "dark"

  const filteredBusinesses = useMemo(() => {
    let filtered = businesses

    if (searchQuery) {
      filtered = filtered.filter(
        (business) =>
          business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          business.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (business.bmId && business.bmId.includes(searchQuery)),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((business) => business.status === statusFilter)
    }

    // Sort businesses
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "activity":
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        case "accounts":
          return (b.accountsCount || 0) - (a.accountsCount || 0)
        case "balance":
          return (b.totalBalance || 0) - (a.totalBalance || 0)
        default:
          return 0
      }
    })
  }, [businesses, searchQuery, statusFilter, sortBy])

  const handleBusinessClick = (business: MockBusiness, e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest("button") ||
      target.closest('[role="dialog"]') ||
      target.closest("a") ||
      target.closest(".edit-dialog-trigger")
    ) {
      return
    }

    // Only allow navigation for approved businesses
    if (business.status !== 'active') {
      return
    }

    // Navigate to accounts page filtered by this business
    router.push(`/dashboard/accounts?business=${encodeURIComponent(business.name)}`)
  }

  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(bmId)
  }

  const handleBusinessUpdated = (updatedBusiness: MockBusiness) => {
    // Use the demo state management to update the business
    // This will automatically trigger re-renders across all components
    console.log("Business updated:", updatedBusiness)
    // Note: The EditBusinessDialog should handle calling the updateBusiness function from demo state
  }

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return
    
    try {
      await deleteBusiness(businessToDelete.id)
      setDeleteDialogOpen(false)
      setBusinessToDelete(null)
    } catch (error) {
      console.error('Failed to delete business:', error)
    }
  }

  const handleApproveBusiness = async (business: MockBusiness) => {
    try {
      await approveBusiness(business.id)
    } catch (error) {
      console.error('Failed to approve business:', error)
    }
  }

  const openDeleteDialog = (business: MockBusiness, e: React.MouseEvent) => {
    e.stopPropagation()
    setBusinessToDelete(business)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search businesses, industries, or BM ID..."
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
              <SelectItem value="balance" className="text-popover-foreground hover:bg-accent">
                Balance
              </SelectItem>
            </SelectContent>
          </Select>

          <BusinessesViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {view === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              onClick={(e) => handleBusinessClick(business, e)}
              className={cn(
                "bg-card border border-border/60 rounded-lg p-4 transition-all duration-150 group",
                business.status === "active" 
                  ? "cursor-pointer hover:border-border hover:shadow-sm hover:border-[#c4b5fd]/40" 
                  : "cursor-not-allowed opacity-75",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {business.logo ? (
                    <div className="h-8 w-8 rounded-md overflow-hidden bg-muted/50">
                      <img
                        src={business.logo || "/placeholder.svg"}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={getBusinessAvatarClasses('md', currentMode)}>
                      <span>{getInitials(business.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate text-sm">{business.name}</h3>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">{business.industry}</p>
                    {business.status !== 'active' && (
                      <p className="text-xs text-amber-600 mt-1">
                        {business.status === 'pending' ? 'Awaiting approval' : 'Not available'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center gap-2">
                  <StatusBadge status={business.status as any} size="sm" />
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-md hover:bg-muted/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <EditBusinessDialog
                          business={business}
                          onBusinessUpdated={handleBusinessUpdated}
                          trigger={
                            <DropdownMenuItem 
                              className="text-popover-foreground hover:bg-accent cursor-pointer"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Business
                            </DropdownMenuItem>
                          }
                        />
                        {business.status === 'pending' && (
                          <DropdownMenuItem 
                            className="text-popover-foreground hover:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApproveBusiness(business)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Business
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={(e) => openDeleteDialog(business, e)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Business
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* BM ID */}
              {business.bmId && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground/60">BM ID:</span>
                    <code className="font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded text-xs">{business.bmId}</code>
                    <button
                      onClick={(e) => copyBmId(business.bmId!, e)}
                      className="p-0.5 hover:bg-muted/50 rounded transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      title="Copy BM ID"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground/60" />
                    </button>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-lg font-semibold text-foreground">{business.accountsCount}</div>
                  <div className="text-xs text-muted-foreground/70">Ad Accounts</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">${formatCurrency(business.totalBalance)}</div>
                  <div className="text-xs text-muted-foreground/70">Total Balance</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground/60 pt-2 border-t border-border/40">
                <span>Created {business.dateCreated}</span>
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-1.5">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              onClick={(e) => handleBusinessClick(business, e)}
              className={cn(
                "bg-card border border-border rounded-lg p-3 shadow-sm transition-all duration-200 group",
                business.status === "active"
                  ? "cursor-pointer hover:shadow-md hover:border-border/60 hover:bg-card/80 hover:border-[#c4b5fd]/30"
                  : "cursor-not-allowed opacity-75",
              )}
            >
              <div className="flex items-center justify-between">
                {/* Left: Business Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {business.logo ? (
                    <div className="h-8 w-8 rounded-lg overflow-hidden">
                      <img
                        src={business.logo || "/placeholder.svg"}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={getBusinessAvatarClasses('md', currentMode)}>
                      <span>{getInitials(business.name)}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h3 className="font-medium text-foreground truncate text-sm">{business.name}</h3>
                      <StatusBadge status={business.status as any} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{business.industry}</span>
                      <span>•</span>
                      <span>Created {business.dateCreated}</span>
                      {business.status !== 'active' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600">
                            {business.status === 'pending' ? 'Awaiting approval' : 'Not available'}
                          </span>
                        </>
                      )}
                      {business.bmId && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">{business.bmId}</code>
                            <button
                              onClick={(e) => copyBmId(business.bmId!, e)}
                              className="p-0.5 hover:bg-accent rounded transition-colors"
                            >
                              <Copy className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center w-20">
                    <div className="text-xs text-muted-foreground mb-0.5">Accounts</div>
                    <div className="font-semibold text-foreground text-base">{business.accountsCount}</div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-20">
                    <div className="text-xs text-muted-foreground mb-0.5">Balance</div>
                    <div className="font-semibold text-foreground text-base">
                      ${formatCurrency(business.totalBalance)}
                    </div>
                  </div>
                  {business.status === 'active' ? (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <div className="h-4 w-4" /> // Empty space to maintain alignment
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No businesses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by applying for your first business"}
          </p>
        </div>
      )}

      {/* Results count */}
      <div className="text-xs text-muted-foreground">
        Showing {filteredBusinesses.length} of {businesses.length} businesses
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Business</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{businessToDelete?.name}&quot;? This action cannot be undone and will also delete all associated ad accounts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBusiness}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Business
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 