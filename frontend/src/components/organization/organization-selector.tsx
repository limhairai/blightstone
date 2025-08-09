"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from "../ui/dropdown-menu"

import { Input } from "../ui/input"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"
import { ChevronDown, Search, Building2, Users, Loader2, CreditCard, Check } from "lucide-react"
import { cn } from "../../lib/utils"
import { useOrganizationStore } from "../../lib/stores/organization-store"
import { useAuth } from "../../contexts/AuthContext"
import { useOrganizations, useCurrentOrganization, useBusinessManagers } from "../../lib/swr-config"
import { useAdminClientSeparation } from "../../hooks/useAdminClientSeparation"


interface Organization {
  id: string
  name: string
  avatar?: string
  role: string
  businessCount: number
}

interface BusinessManager {
  id: string
  name: string
  organizationId: string
  status: "active" | "pending" | "suspended" | "rejected"
  accountCount: number
}

export function OrganizationSelector() {
  // ⚡ ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC OR EARLY RETURNS
  const { theme } = useTheme()
  const router = useRouter()
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore()
  const { session, user } = useAuth()
  const { isAdmin, loading: separationLoading } = useAdminClientSeparation()
  const currentTheme = (theme === "dark" || theme === "light") ? theme : "light"
  
  const [componentIsLoading, setComponentIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredOrgId, setHoveredOrgId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Use refs to manage hover delays
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 🚀 PERFORMANCE: Consolidated data fetching with better caching
  const { data: orgData, isLoading: isOrgLoading, error: orgError } = useOrganizations() // For dropdown list
  const { data: currentOrgData, isLoading: isCurrentOrgLoading, error: currentOrgError } = useCurrentOrganization(currentOrganizationId) // For current org display
  // Only fetch business managers if we have a current organization - reduces unnecessary API calls
  const { data: bizData, isLoading: isBizLoading, error: bizError } = useBusinessManagers()
  
  const allOrganizations = orgData?.organizations || [];
  const allBusinessManagers = Array.isArray(bizData) ? bizData : [];
  
  // Handle auth errors gracefully - don't show errors for 401/403, just show loading state
  const hasAuthError = orgError && (orgError.message.includes('401') || orgError.message.includes('403'))
  const hasCurrentOrgAuthError = currentOrgError && (currentOrgError.message.includes('401') || currentOrgError.message.includes('403'))
  
  // Get current organization directly from the dedicated hook instead of filtering all orgs
  const currentOrganization = currentOrgData?.organizations?.[0] || null;

  // FIXED: Improved loading logic to prevent infinite loading states
  const shouldShowLoading = componentIsLoading || (
    // Show loading only if we're actively loading and don't have data yet
    (isOrgLoading && !orgData) || 
    // For current org, only show loading if we're loading AND we have a valid org ID
    (isCurrentOrgLoading && !currentOrgData && currentOrganizationId) ||
    // Business managers loading only if we have an org ID and are loading
    (isBizLoading && !bizData && currentOrganizationId) ||
    // Auth errors
    hasAuthError || 
    hasCurrentOrgAuthError
  )

  // FIXED: Better fallback logic to prevent infinite loading
  const selectedOrg = useMemo<Organization>(() => {
    // If we have current organization data, use it
    if (currentOrganization) {
      // For the current organization, prefer actual business manager count over stored count
      // But only if we have successfully loaded the business managers (not during loading)
      let businessCount = currentOrganization.business_count || 0;
      
      // Only use live business manager count if:
      // 1. We're not loading business managers
      // 2. We have business manager data
      // 3. This is the current organization
      if (!isBizLoading && bizData && currentOrganization.id === currentOrganizationId) {
        businessCount = allBusinessManagers.length;
      }
      
      return {
        id: currentOrganization.id,
        name: currentOrganization.name,
        avatar: currentOrganization.avatar,
        role: "Owner",
        businessCount: businessCount,
      };
    }
    
    // Fallback: try to find current org in the organizations list
    if (currentOrganizationId && allOrganizations.length > 0) {
      const fallbackOrg = allOrganizations.find((org: any) => org.id === currentOrganizationId);
      if (fallbackOrg) {
        return {
          id: fallbackOrg.id,
          name: fallbackOrg.name,
          avatar: fallbackOrg.avatar,
          role: "Owner",
          businessCount: fallbackOrg.business_count || 0,
        };
      }
    }
    
    // If we have organizations but no current org ID, use the first one
    if (allOrganizations.length > 0 && !currentOrganizationId) {
      const firstOrg = allOrganizations[0];
      return {
        id: firstOrg.id,
        name: firstOrg.name,
        avatar: firstOrg.avatar,
        role: "Owner",
        businessCount: firstOrg.business_count || 0,
      };
    }
    
    // Show loading state only if we're actually loading
    if (shouldShowLoading) {
      return {
        id: "loading",
        name: "Loading...",
        role: "Loading",
        businessCount: 0,
      };
    }
    
    // Final fallback - no organization found
    return {
      id: "no-org",
      name: "No Organization",
      role: "None",
      businessCount: 0,
    };
  }, [currentOrganization, allBusinessManagers, currentOrganizationId, isBizLoading, bizData, allOrganizations]);

  const organizations: Organization[] = useMemo(() => {
    return allOrganizations.map((org: any) => {
      // Determine role based on actual ownership and membership data
      let role = "Member"; // Default to member
      
      // Check if user is the owner
      if (org.owner_id === user?.id) {
        role = "Owner";
      } else {
        // Check organization membership for admin/member role
        // This data should come from the API response
        role = org.user_role || "Member";
      }
      
      return {
        id: org.id,
        name: org.name,
        avatar: org.avatar,
        role: role,
        // Use stored business count for non-current organizations
        // Use live count only for current organization if we have the data
        businessCount: org.id === currentOrganizationId && !isBizLoading && bizData
          ? allBusinessManagers.length 
          : org.business_count || 0
      };
    })
  }, [allOrganizations, currentOrganizationId, allBusinessManagers, isBizLoading, bizData, user?.id])

  // Convert business managers to the format expected by the component
  const businessManagers: BusinessManager[] = useMemo(() => {
    if (!Array.isArray(allBusinessManagers)) {
      return [];
    }
    
    return allBusinessManagers.map(bm => ({
      id: bm.id,
      name: bm.name,
      organizationId: currentOrganizationId!, // Business managers are always for current org
      status: bm.status === 'processing' || bm.status === 'pending' 
        ? 'pending' as const 
        : bm.status as "active" | "pending" | "suspended" | "rejected",
      accountCount: bm.ad_account_count || 0
    }))
  }, [allBusinessManagers, currentOrganizationId])

  // Improved hover handlers with delays
  const handleOrgMouseEnter = useCallback((orgId: string) => {
    // Clear any pending leave timeout
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    
    // Set hover with a small delay to prevent flickering
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredOrgId(orgId)
    }, 100) // 100ms delay before showing businesses
  }, [])

  const handleOrgMouseLeave = useCallback(() => {
    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    
    // Delay clearing the hover to allow moving to business items
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredOrgId(null)
    }, 300) // 300ms delay before hiding businesses
  }, [])

  const handleBusinessesMouseEnter = useCallback(() => {
    // Cancel any pending leave timeout when entering business area
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }, [])

  const handleBusinessesMouseLeave = useCallback(() => {
    // Set a timeout to clear hover when leaving business area
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredOrgId(null)
    }, 200) // 200ms delay
  }, [])

  // Handle business manager click with proper Next.js navigation
  const handleBusinessManagerClick = useCallback(async (bm: BusinessManager) => {
    setIsDropdownOpen(false)
    setSearchQuery("")
    setHoveredOrgId(null)
    
    // Check if business manager belongs to a different organization
    if (bm.organizationId !== selectedOrg.id) {
      // Switch to the business manager's organization first
      setComponentIsLoading(true)
      
      // Add a delay to make the switching more noticeable
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setCurrentOrganizationId(bm.organizationId)
      setComponentIsLoading(false)
      
      // Wait a bit more for the organization switch to complete
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Navigate to accounts page with business manager filter
    const bmParam = encodeURIComponent(bm.id)
    router.push(`/dashboard/accounts?bm_id=${bmParam}`)
  }, [router, selectedOrg.id, setCurrentOrganizationId])

  // Clean up timeouts on unmount
  const cleanupTimeouts = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
  }, [])

  const filteredOrganizations = searchQuery
    ? organizations.filter((org) => org.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : organizations

  const displayOrgId = hoveredOrgId || selectedOrg.id
  const filteredBusinessManagers = searchQuery
    ? businessManagers
        .filter((bm) => bm.organizationId === displayOrgId)
        .filter((bm) => bm.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : businessManagers.filter((bm) => bm.organizationId === displayOrgId)

  // Handle organization click with switching functionality
  const handleOrganizationClick = useCallback(async (org: Organization) => {
    if (org.id !== selectedOrg.id) {
      setComponentIsLoading(true)
      setIsDropdownOpen(false)
      
      // Add a delay to make the switching more noticeable
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setCurrentOrganizationId(org.id)
      setComponentIsLoading(false)
    }
    setSearchQuery("")
    setHoveredOrgId(null)
    cleanupTimeouts()
  }, [selectedOrg.id, setCurrentOrganizationId, cleanupTimeouts])

  // Only show global loading for initial loads, not for every API call
  const globalLoading = (isOrgLoading && !orgData) || (isBizLoading && !bizData && currentOrganizationId);

  // Show error state only for non-auth errors
  const hasNonAuthError = (orgError && !orgError.message.includes('401') && !orgError.message.includes('403')) || 
                          (bizError && !bizError.message.includes('401') && !bizError.message.includes('403'))
  
  if (hasNonAuthError) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between bg-background border-border text-muted-foreground"
        disabled
      >
        <div className="flex items-center">
          <div className="h-6 w-6 mr-2 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">!</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Error loading organizations</span>
            <span className="text-xs text-muted-foreground">Please refresh</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
      </Button>
    )
  }

  // Show a simple loading state instead of "Loading..."
  if (globalLoading || selectedOrg.id === "loading") {
    return (
      <Button
        variant="outline"
        className="w-full justify-between bg-background border-border text-foreground"
        disabled
      >
        <div className="flex items-center">
          <div className="h-6 w-6 mr-2 rounded-full bg-muted animate-pulse" />
          <div className="flex flex-col items-start">
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            <div className="h-2 w-16 bg-muted animate-pulse rounded mt-1" />
          </div>
        </div>
        <Loader2 className="h-4 w-4 ml-2 text-muted-foreground animate-spin" />
      </Button>
    )
  }

  // Handle case where user has no organizations
  if (selectedOrg.id === "no-org" && !globalLoading) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between bg-background border-border text-muted-foreground"
        disabled
      >
        <div className="flex items-center">
          <div className="h-6 w-6 mr-2 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">?</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">No Organization</span>
            <span className="text-xs text-muted-foreground">Contact support</span>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <div className="relative w-full">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-border text-foreground hover:bg-[#F5F5F5]"
            disabled={Boolean(componentIsLoading || globalLoading)}
          >
            <div className="flex items-center">
              <div className="flex flex-col items-start">
                <span className="truncate max-w-[150px] text-foreground text-sm font-medium">{selectedOrg.name}</span>
              </div>
            </div>
            {componentIsLoading || globalLoading ? (
              <Loader2 className="h-4 w-4 ml-2 text-muted-foreground animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[380px] bg-popover border-border p-0"
          onCloseAutoFocus={cleanupTimeouts}
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Find Team or Business Manager..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                Teams
              </DropdownMenuLabel>
              
              {filteredOrganizations.map((org) => (
                <div key={org.id} className="relative">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center p-2 cursor-pointer rounded-md hover:bg-[#F5F5F5]",
                      org.id === selectedOrg.id && "bg-accent"
                    )}
                    onMouseEnter={() => handleOrgMouseEnter(org.id)}
                    onMouseLeave={handleOrgMouseLeave}
                    onClick={() => handleOrganizationClick(org)}
                  >

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                        {org.id === selectedOrg.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="mr-2">{org.role}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>
              ))}

              {/* Show business managers for hovered or selected organization */}
              {filteredBusinessManagers.length > 0 && (
                <div
                  className="mt-2 ml-4 pl-4 border-l border-border"
                  onMouseEnter={handleBusinessesMouseEnter}
                  onMouseLeave={handleBusinessesMouseLeave}
                >
                  <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                    Business Managers
                  </DropdownMenuLabel>
                  {filteredBusinessManagers.map((bm) => (
                    <DropdownMenuItem
                      key={bm.id}
                      className="flex items-center p-2 cursor-pointer rounded-md hover:bg-[#F5F5F5]/50 ml-2"
                      onClick={() => handleBusinessManagerClick(bm)}
                    >
                      <Building2 className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{bm.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className={cn(
                            "inline-block w-2 h-2 rounded-full mr-2",
                            bm.status === "active" ? "bg-secondary" : 
                            bm.status === "pending" ? "bg-muted" : "bg-muted"
                          )} />
                          <span className="mr-2 capitalize">{bm.status}</span>
                          <span>{bm.accountCount} accounts</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 