"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { EditBusinessDialog } from "@/components/edit-business-dialog"
import { BusinessesViewToggle } from "@/components/businesses-view-toggle"
import { Button } from "@/components/ui/button"
import { MOCK_BUSINESSES } from "@/data/mock-businesses"
import { formatCurrency } from "@/utils/format"
import { Search, ArrowRight, Building2, Copy, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Business } from "@/types/business"

export function BusinessesTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES)
  const router = useRouter()

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
  }, [businesses, searchQuery, statusFilter, sortBy])

  const handleBusinessClick = (business: Business, e: React.MouseEvent) => {
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

    // Navigate to ad accounts page with business filter
    const businessParam = encodeURIComponent(business.name)
    window.location.href = `/accounts?business=${businessParam}`
  }

  const getBusinessInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  const copyBmId = (bmId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(bmId)
  }

  const handleBusinessUpdated = (updatedBusiness: Business) => {
    setBusinesses((prev) => prev.map((business) => (business.id === updatedBusiness.id ? updatedBusiness : business)))
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
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer group",
                "hover:shadow-md hover:border-border/60 hover:bg-card/80",
                business.status === "active" && "hover:border-[#c4b5fd]/30",
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
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                      <span className="text-white font-semibold">{getBusinessInitial(business.name)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
                      <StatusBadge status={business.status as any} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">{business.industry}</p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditBusinessDialog
                      business={business}
                      onBusinessUpdated={handleBusinessUpdated}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 rounded-md hover:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      }
                    />
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
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
                "bg-card border border-border rounded-lg p-4 shadow-sm transition-all duration-200 cursor-pointer group",
                "hover:shadow-md hover:border-border/60 hover:bg-card/80",
                business.status === "active" && "hover:border-[#c4b5fd]/30",
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
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
                      <span className="text-white font-semibold">{getBusinessInitial(business.name)}</span>
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
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
    </div>
  )
}
