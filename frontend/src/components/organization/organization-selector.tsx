"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import useSWR from 'swr'
import { Check, ChevronDown, Plus, Search, Building2, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { cn } from "../../lib/utils"
import { getInitials } from "../../utils/format"
import { getAvatarClasses } from "../../lib/design-tokens"
import { useTheme } from "next-themes"
import { useOrganizationStore } from "@/lib/stores/organization-store"

interface Organization {
  id: string
  name: string
  avatar?: string
  role: string
  businessCount: number
}

interface Business {
  id: string
  name: string
  organizationId: string
  status: "active" | "pending" | "suspended" | "rejected"
  accountCount: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function OrganizationSelector() {
  const { theme } = useTheme()
  const router = useRouter()
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore()
  const currentTheme = (theme === "dark" || theme === "light") ? theme : "light"
  
  const [componentIsLoading, setComponentIsLoading] = useState(false)

  const { data: orgData, isLoading: isOrgLoading } = useSWR('/api/organizations', fetcher);
  const { data: bizData, isLoading: isBizLoading } = useSWR('/api/businesses', fetcher);
  const { data: accData, isLoading: isAccLoading } = useSWR('/api/ad-accounts', fetcher);
  
  const allOrganizations = orgData?.organizations || [];
  const allBusinesses = bizData?.businesses || [];
  const allAccounts = accData?.accounts || [];

  const currentOrganization = useMemo(() => allOrganizations.find(o => o.id === currentOrganizationId), [allOrganizations, currentOrganizationId]);

  // Use real organization data from context
  const selectedOrg = useMemo<Organization>(() => ({
    id: currentOrganization?.id || "default",
    name: currentOrganization?.name || "Default Organization",
    avatar: currentOrganization?.avatar,
    role: "Owner", // Could be derived from user's role in the organization
    businessCount: allBusinesses.filter(b => b.organization_id === currentOrganization?.id).length,
  }), [currentOrganization, allBusinesses])

  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredOrgId, setHoveredOrgId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Use refs to manage hover delays
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const organizations: Organization[] = useMemo(() => {
    return allOrganizations.map(org => ({
      id: org.id,
      name: org.name,
      avatar: org.avatar,
      role: org.id === currentOrganizationId ? "Owner" : "Member",
      businessCount: allBusinesses.filter(b => b.organization_id === org.id).length
    }))
  }, [allOrganizations, currentOrganizationId, allBusinesses])

  // Convert context state businesses to the format expected by the component
  const businesses: Business[] = useMemo(() => {
    return allBusinesses.map(business => ({
      id: business.id,
      name: business.name,
      organizationId: business.organization_id,
      status: business.status === 'under_review' || business.status === 'provisioning' || business.status === 'ready' 
        ? 'pending' as const 
        : business.status as "active" | "pending" | "suspended" | "rejected",
      accountCount: allAccounts.filter(account => account.business_id === business.id).length
    }))
  }, [allBusinesses, allAccounts])

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

  // Handle business click with proper Next.js navigation
  const handleBusinessClick = useCallback(async (business: Business) => {
    setIsDropdownOpen(false)
    setSearchQuery("")
    setHoveredOrgId(null)
    
    // Check if business belongs to a different organization
    if (business.organizationId !== selectedOrg.id) {
      // Switch to the business's organization first
      setComponentIsLoading(true)
      
      // Add a delay to make the switching more noticeable
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setCurrentOrganizationId(business.organizationId)
      setComponentIsLoading(false)
      
      // Wait a bit more for the organization switch to complete
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    // Navigate to accounts page with business filter
    const businessParam = encodeURIComponent(business.name)
    router.push(`/dashboard/accounts?business=${businessParam}`)
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
  const filteredBusinesses = searchQuery
    ? businesses
        .filter((business) => business.organizationId === displayOrgId)
        .filter((business) => business.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : businesses.filter((business) => business.organizationId === displayOrgId)

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

  const globalLoading = isOrgLoading || isBizLoading || isAccLoading;

  if (globalLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="relative w-full">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-border text-foreground hover:bg-accent"
            disabled={componentIsLoading || globalLoading}
          >
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {selectedOrg.avatar ? (
                  <AvatarImage src={selectedOrg.avatar} alt={selectedOrg.name} />
                ) : (
                  <AvatarFallback className={getAvatarClasses('sm', currentTheme)}>
                    {getInitials(selectedOrg.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="truncate max-w-[150px] text-foreground text-sm font-medium">{selectedOrg.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedOrg.businessCount} {selectedOrg.businessCount === 1 ? "business" : "businesses"}
                </span>
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
                placeholder="Find Organization or Business..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8 bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                Organizations
              </DropdownMenuLabel>
              
              {filteredOrganizations.map((org) => (
                <div key={org.id} className="relative">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center p-2 cursor-pointer rounded-md hover:bg-accent",
                      org.id === selectedOrg.id && "bg-accent"
                    )}
                    onMouseEnter={() => handleOrgMouseEnter(org.id)}
                    onMouseLeave={handleOrgMouseLeave}
                    onClick={() => handleOrganizationClick(org)}
                  >
                    <Avatar className="h-8 w-8 mr-3">
                      {org.avatar ? (
                        <AvatarImage src={org.avatar} alt={org.name} />
                      ) : (
                        <AvatarFallback className={getAvatarClasses('sm', currentTheme)}>
                          {getInitials(org.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                        {org.id === selectedOrg.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span className="mr-2">{org.role}</span>
                        <span>{org.businessCount} {org.businessCount === 1 ? "business" : "businesses"}</span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </div>
              ))}

              {/* Show businesses for hovered or selected organization */}
              {filteredBusinesses.length > 0 && (
                <div
                  className="mt-2"
                  onMouseEnter={handleBusinessesMouseEnter}
                  onMouseLeave={handleBusinessesMouseLeave}
                >
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                    Businesses
                  </DropdownMenuLabel>
                  
                  {filteredBusinesses.map((business) => (
                    <DropdownMenuItem
                      key={business.id}
                      className="flex items-center p-2 cursor-pointer rounded-md hover:bg-accent ml-4"
                      onClick={() => handleBusinessClick(business)}
                    >
                      <Building2 className="h-4 w-4 mr-3 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{business.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2",
                            business.status === "active" && "bg-green-100 text-green-800",
                            business.status === "pending" && "bg-yellow-100 text-yellow-800",
                            business.status === "suspended" && "bg-red-100 text-red-800",
                            business.status === "rejected" && "bg-gray-100 text-gray-800"
                          )}>
                            {business.status}
                          </span>
                          <span>{business.accountCount} {business.accountCount === 1 ? "account" : "accounts"}</span>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem
                className="flex items-center p-2 cursor-pointer rounded-md hover:bg-accent text-primary"
                onClick={() => {
                  setIsDropdownOpen(false)
                  router.push("/dashboard/settings/organizations")
                }}
              >
                <Plus className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">Create Organization</span>
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 