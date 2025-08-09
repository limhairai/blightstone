"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import useSWR, { useSWRConfig } from 'swr'
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { StatusBadge } from "../ui/status-badge"
import { EditBusinessDialog } from "./edit-business-dialog"
import { BusinessesViewToggle } from "../businesses/businesses-view-toggle"
import { Button } from "../ui/button"
import { formatCurrency } from "../../lib/utils"
import { getInitials } from "../../utils/format"
import { getBusinessAvatarClasses } from "../../lib/design-tokens"
import { Search, ArrowRight, Building2, Copy, Edit, MoreHorizontal, Trash2, CheckCircle } from "lucide-react"
import { cn } from "../../lib/utils"
import { layout } from "../../lib/layout-utils"
import { contentTokens } from "../../lib/content-tokens"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { useAuth } from '@/contexts/AuthContext'
import { authenticatedFetcher } from '@/lib/swr-config'
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

type AppBusiness = {
  id: string;
  name: string;
  type?: string;
  status: 'active' | 'pending' | 'inactive';
  dateCreated: string;
  balance?: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function BusinessesTable() {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  const { theme } = useTheme()
  const { mutate } = useSWRConfig()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [industryFilter, setIndustryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("activity")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [businessToDelete, setBusinessToDelete] = useState<AppBusiness | null>(null)
  const router = useRouter()

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (industryFilter !== 'all') params.set('industry', industryFilter);
    params.set('sort_by', sortBy);
    return params.toString();
  }, [searchQuery, statusFilter, industryFilter, sortBy]);

  const { data: businessesData, error, isLoading } = useSWR(
    session && currentOrganizationId ? [`/api/businesses?${queryString}`, session.access_token] : null,
    ([url, token]) => authenticatedFetcher(url, token)
  );
  
  const businesses = businessesData?.businesses || [];

  const currentMode = theme === "light" ? "light" : "dark"

  const handleBusinessClick = (business: AppBusiness, e: React.MouseEvent) => {
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

    // Navigate to business details page
    router.push(`/dashboard/businesses/${business.id}`)
  }

  const copyBusinessId = (businessId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(businessId)
  }

  const handleBusinessUpdated = (updatedBusiness: AppBusiness) => {
    // This will be handled by SWR revalidation
    
  }

  const handleDeleteBusiness = async () => {
    if (!businessToDelete) return
    
    try {
      const response = await fetch(`/api/businesses/${businessToDelete.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete business');
      }
      mutate(`/api/businesses?${queryString}`);
      setDeleteDialogOpen(false)
      setBusinessToDelete(null)
    } catch (error) {
      console.error('Failed to delete business:', error)
    }
  }

  const handleApproveBusiness = async (business: AppBusiness) => {
    try {
      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      if (!response.ok) {
        throw new Error('Failed to approve business');
      }
      mutate(`/api/businesses?${queryString}`);
    } catch (error) {
      console.error('Failed to approve business:', error)
    }
  }

  const openDeleteDialog = (business: AppBusiness, e: React.MouseEvent) => {
    e.stopPropagation()
    setBusinessToDelete(business)
    setDeleteDialogOpen(true)
  }

  // Get unique types from current businesses for filter
  const uniqueIndustries = Array.from(new Set(businesses.map((business: AppBusiness) => business.type).filter(Boolean)))

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
              <SelectItem value="all" className="text-popover-foreground hover:bg-[#F5F5F5]">
                All Statuses
              </SelectItem>
              <SelectItem value="active" className="text-popover-foreground hover:bg-[#F5F5F5]">
                {contentTokens.status.active}
              </SelectItem>
              <SelectItem value="pending" className="text-popover-foreground hover:bg-[#F5F5F5]">
                {contentTokens.status.pending}
              </SelectItem>
              <SelectItem value="inactive" className="text-popover-foreground hover:bg-[#F5F5F5]">
                {contentTokens.status.inactive}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-background border-border text-foreground">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-popover-foreground hover:bg-[#F5F5F5]">
                All Industries
              </SelectItem>
              {uniqueIndustries.map((industry) => (
                <SelectItem key={String(industry)} value={String(industry)} className="text-popover-foreground hover:bg-[#F5F5F5]">
                  {String(industry)}
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
              <SelectItem value="activity" className="text-popover-foreground hover:bg-[#F5F5F5]">
                Last Activity
              </SelectItem>
              <SelectItem value="name" className="text-popover-foreground hover:bg-[#F5F5F5]">
                Name
              </SelectItem>
              <SelectItem value="accounts" className="text-popover-foreground hover:bg-[#F5F5F5]">
                Ad Accounts
              </SelectItem>
              <SelectItem value="balance" className="text-popover-foreground hover:bg-[#F5F5F5]">
                Balance
              </SelectItem>
            </SelectContent>
          </Select>

          <BusinessesViewToggle view={view} onViewChange={setView} />
        </div>
      </div>
      
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                  <div>
                    <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 w-20 bg-muted rounded mt-1 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full animate-pulse"></div>
              </div>
              <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-muted/30 rounded-md animate-pulse"></div>
                <div className="h-12 bg-muted/30 rounded-md animate-pulse"></div>
              </div>
              <div className="h-4 w-full bg-muted rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground">Failed to load businesses.</p>
        </div>
      )}

      {!isLoading && !error && view === "grid" ? (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business: any) => (
            <div
              key={business.id}
              onClick={(e) => handleBusinessClick(business, e)}
              className={cn(
                "bg-card border-border rounded-lg p-4 shadow-sm transition-all duration-200",
                business.status === 'active' ? "cursor-pointer hover:shadow-md hover:-translate-y-1" : "opacity-70"
              )}
            >
              {/* Card content here */}
            </div>
          ))}
        </div>
      ) : null}
      
      {!isLoading && !error && view === "list" ? (
        <div className="space-y-3">
          {businesses.map((business: any) => (
            <div
              key={business.id}
              onClick={(e) => handleBusinessClick(business, e)}
              className={cn(
                "bg-card border-border rounded-lg p-4 flex items-center justify-between transition-all duration-200",
                business.status === 'active' ? "cursor-pointer hover:shadow-md" : "opacity-70"
              )}
            >
              {/* List item content here */}
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !error && businesses.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No businesses found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || industryFilter !== "all"
                ? "Try adjusting your filters to find what you're looking for."
                : "Get started by applying for your first business"}
            </p>
          </div>
        </div>
      )}

      {!isLoading && businesses.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {businesses.length} of {businessesData?.total || businesses.length} businesses
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the business and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBusiness}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
