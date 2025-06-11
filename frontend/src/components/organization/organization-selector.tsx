"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import { getInitials } from "../../lib/mock-data"
import { getAvatarClasses } from "../../lib/design-tokens"
import { useTheme } from "next-themes"
import { useDemoState } from "../../contexts/DemoStateContext"
import { MOCK_BUSINESSES_BY_ORG } from "../../lib/mock-data"
import { MOCK_ACCOUNTS_BY_ORG } from "../../lib/mock-data"

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

export function OrganizationSelector() {
  const { theme } = useTheme()
  const router = useRouter()
  const { state, switchOrganization } = useDemoState()
  const currentTheme = (theme === "dark" || theme === "light") ? theme : "light"
  
  const [isLoading, setIsLoading] = useState(false)
  
  // Use real organization data from demo state
  const selectedOrg = useMemo<Organization>(() => ({
    id: state.currentOrganization.id,
    name: state.currentOrganization.name,
    avatar: state.currentOrganization.avatar,
    role: "Owner", // Could be derived from user's role in the organization
    businessCount: state.businesses.length,
  }), [state.currentOrganization, state.businesses.length])

  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredOrgId, setHoveredOrgId] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Use refs to manage hover delays
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Convert all organizations from demo state
  const organizations: Organization[] = useMemo(() => {
    return state.organizations.map(org => ({
      id: org.id,
      name: org.name,
      avatar: org.avatar,
      role: org.id === state.currentOrganization.id ? "Owner" : "Member", // Current org is owner, others are member
      businessCount: org.id === state.currentOrganization.id ? state.businesses.length : (MOCK_BUSINESSES_BY_ORG[org.id]?.length || 0) // Real count for all orgs
    }))
  }, [state.organizations, state.currentOrganization.id, state.businesses.length])

  // Convert demo state businesses to the format expected by the component
  const businesses: Business[] = useMemo(() => {
    // Get businesses for all organizations, not just current one
    const allBusinesses: Business[] = []
    
    // Add businesses from all organizations
    Object.entries(MOCK_BUSINESSES_BY_ORG).forEach(([orgId, orgBusinesses]) => {
      orgBusinesses.forEach(business => {
        // Count accounts for this business from the appropriate organization
        const orgAccounts = MOCK_ACCOUNTS_BY_ORG[orgId] || []
        const accountCount = orgAccounts.filter(account => account.business === business.name).length
        
        allBusinesses.push({
          id: business.id,
          name: business.name,
          organizationId: orgId,
          status: business.status,
          accountCount
        })
      })
    })
    
    return allBusinesses
  }, [])

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
  const handleBusinessClick = useCallback((business: Business) => {
    setIsDropdownOpen(false)
    setSearchQuery("")
    setHoveredOrgId(null)
    
    // Navigate to accounts page with business filter
    const businessParam = encodeURIComponent(business.name)
    router.push(`/dashboard/accounts?business=${businessParam}`)
  }, [router])

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
      setIsLoading(true)
      setIsDropdownOpen(false)
      
      // Add a delay to make the switching more noticeable
      await new Promise(resolve => setTimeout(resolve, 800))
      
      switchOrganization(org.id)
      setIsLoading(false)
    }
    setSearchQuery("")
    setHoveredOrgId(null)
    cleanupTimeouts()
  }, [selectedOrg.id, switchOrganization])

  return (
    <div className="relative w-full">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-border text-foreground hover:bg-accent"
            disabled={isLoading}
          >
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {selectedOrg.avatar ? (
                  <AvatarImage src={selectedOrg.avatar || "/placeholder.svg"} alt={selectedOrg.name} />
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
            {isLoading ? (
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
                <DropdownMenuItem
                  key={org.id}
                  className={cn(
                    "flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md",
                    selectedOrg.id === org.id ? "bg-accent" : "",
                  )}
                  onMouseEnter={() => handleOrgMouseEnter(org.id)}
                  onMouseLeave={handleOrgMouseLeave}
                  onClick={() => handleOrganizationClick(org)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Avatar className="h-8 w-8 mr-3">
                      {org.avatar ? (
                        <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                      ) : (
                        <AvatarFallback className={getAvatarClasses('sm', currentTheme)}>
                          {getInitials(org.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-popover-foreground">{org.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{org.role}</span>
                        <span>•</span>
                        <span>
                          {org.businessCount} {org.businessCount === 1 ? "business" : "businesses"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedOrg.id === org.id && <Check className="h-4 w-4 ml-2 text-[#c4b5fd]" />}
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="bg-border mx-2" />

            <div 
              className="p-2"
              onMouseEnter={handleBusinessesMouseEnter}
              onMouseLeave={handleBusinessesMouseLeave}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                {hoveredOrgId
                  ? `${organizations.find((org) => org.id === hoveredOrgId)?.name} Businesses`
                  : "Businesses"}
              </DropdownMenuLabel>
              {filteredBusinesses.map((business) => (
                <DropdownMenuItem
                  key={business.id}
                  className="flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md"
                  onClick={() => handleBusinessClick(business)}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Building2 className="h-4 w-4 mr-3 text-muted-foreground" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium truncate text-popover-foreground">{business.name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{business.accountCount} accounts</span>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            business.status === "active"
                              ? "bg-emerald-500"
                              : business.status === "pending"
                                ? "bg-yellow-500"
                                : "bg-red-500",
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="bg-border mx-2" />

            <div className="p-2">
              <DropdownMenuItem 
                className="flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md"
                onClick={() => {
                  setIsDropdownOpen(false)
                  router.push('/dashboard/settings')
                }}
              >
                <Plus className="h-4 w-4 mr-3" />
                <span>Create Organization</span>
              </DropdownMenuItem>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 