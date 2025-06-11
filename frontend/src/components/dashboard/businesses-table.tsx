"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { StatusBadge } from "../ui/status-badge"
import { EditBusinessDialog } from "./edit-business-dialog"
import { BusinessesViewToggle } from "../businesses/businesses-view-toggle"
import { Button } from "../ui/button"
import { type MockBusiness, getInitials, formatCurrency } from "../../lib/mock-data"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { Search, ArrowRight, Building2, Copy, Edit, MoreHorizontal, Trash2, CheckCircle } from "lucide-react"
import { cn } from "../../lib/utils"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"
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
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("grid")
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
          business.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (business.bmId && business.bmId.includes(searchQuery)),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((business) => business.status === statusFilter)
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter((business) => business.industry === industryFilter)
    }

    // Sort businesses
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "activity":
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        case "accounts":
          return b.accountsCount - a.accountsCount
        case "balance":
          return b.totalBalance - a.totalBalance
        default:
          return 0
      }
    })
  }, [businesses, searchQuery, statusFilter, industryFilter, sortBy])

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

    // Navigate to ad accounts page with business filter
    const businessParam = encodeURIComponent(business.name)
    window.location.href = `/dashboard/accounts?business=${businessParam}`
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

  // Get unique industries from current businesses for filter
  const uniqueIndustries = Array.from(new Set(businesses.map((business) => business.industry)))

  return (
    <div className={layout.stackMedium}>
      {/* Header */}
      <div className={layout.flexBetween}>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Businesses</h2>
          <p className="text-sm text-muted-foreground">Manage your business profiles and applications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder={contentTokens.placeholders.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
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
                {contentTokens.status.active}
              </SelectItem>
              <SelectItem value="pending" className="text-popover-foreground hover:bg-accent">
                {contentTokens.status.pending}
              </SelectItem>
              <SelectItem value="inactive" className="text-popover-foreground hover:bg-accent">
                {contentTokens.status.inactive}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-background border-border text-foreground">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground hover:bg-accent">
                All Industries
              </SelectItem>
              {uniqueIndustries.map((industry) => (
                <SelectItem key={industry} value={industry} className="text-popover-foreground hover:bg-accent">
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="flex items-center gap-3">
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
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 group",
                business.status === "active"
                  ? "cursor-pointer hover:shadow-md hover:border-border/60 hover:bg-card/80 hover:border-[#c4b5fd]/30"
                  : "cursor-not-allowed opacity-75",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {business.logo ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden">
                      <img
                        src={business.logo || "/placeholder.svg"}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={getBusinessAvatarClasses('lg', currentMode)}>
                      <span>{getInitials(business.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
                      <StatusBadge status={business.status as any} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">{business.industry}</p>
                    {business.status !== 'active' && (
                      <p className="text-xs text-amber-600 mt-1">
                        {business.status === 'pending' ? 'Awaiting approval' : 'Not available'}
                      </p>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-accent"
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

              {/* BM ID - Always reserve space for alignment */}
              <div className="mb-3 flex items-center min-h-[24px]">
                {business.bmId ? (
                  <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-xs text-muted-foreground">
                    <span>BM ID:</span>
                    <code className="text-xs">{business.bmId}</code>
                    <button
                      onClick={(e) => copyBmId(business.bmId!, e)}
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
                  <div className="text-xs text-muted-foreground mb-1">Accounts</div>
                  <div className="font-semibold text-foreground text-lg">{business.accountsCount}</div>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-muted/30 rounded-md">
                  <div className="text-xs text-muted-foreground mb-1">Balance</div>
                  <div className="font-semibold text-foreground text-lg">${formatCurrency(business.totalBalance)}</div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                {business.status === 'active' ? (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <div className="h-4 w-4" /> // Empty space to maintain alignment
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              onClick={(e) => handleBusinessClick(business, e)}
              className={cn(
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 group",
                business.status === "active"
                  ? "cursor-pointer hover:shadow-md hover:border-border/60 hover:bg-card/80 hover:border-[#c4b5fd]/30"
                  : "cursor-not-allowed opacity-75",
              )}
            >
              <div className="flex items-center justify-between">
                {/* Left: Business Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {business.logo ? (
                    <div className="h-10 w-10 rounded-lg overflow-hidden">
                      <img
                        src={business.logo || "/placeholder.svg"}
                        alt={business.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={getBusinessAvatarClasses('lg', currentMode)}>
                      <span>{getInitials(business.name)}</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
                      <StatusBadge status={business.status as any} size="sm" />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center justify-center w-24">
                    <div className="text-xs text-muted-foreground mb-1">Accounts</div>
                    <div className="font-semibold text-foreground text-lg">{business.accountsCount}</div>
                  </div>
                  <div className="flex flex-col items-center justify-center w-24">
                    <div className="text-xs text-muted-foreground mb-1">Balance</div>
                    <div className="font-semibold text-foreground text-lg">
                      ${formatCurrency(business.totalBalance)}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
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
                  
                  {business.status === 'active' ? (
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <div className="h-5 w-5" /> // Empty space to maintain alignment
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

      {/* Results Summary */}
      {filteredBusinesses.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </div>
      )}

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
