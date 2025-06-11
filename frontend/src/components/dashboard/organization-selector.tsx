"use client"

import { useState } from "react"
import { Check, ChevronDown, Plus, Search, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { cn } from "../../lib/utils"

// Update the Organization interface to remove accountCount
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
  status: "active" | "pending" | "suspended"
  accountCount: number
}

export function OrganizationSelector() {
  // Update the selectedOrg state to remove accountCount
  const [selectedOrg, setSelectedOrg] = useState<Organization>({
    id: "3",
    name: "Startup Project",
    avatar: "/placeholder.svg?height=32&width=32&text=SP",
    role: "Member",
    businessCount: 3,
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [hoveredOrgId, setHoveredOrgId] = useState<string | null>(null)

  // Update the organizations array to remove accountCount
  const organizations: Organization[] = [
    {
      id: "1",
      name: "Personal Account",
      role: "Owner",
      businessCount: 1,
    },
    {
      id: "2",
      name: "Acme Corporation",
      avatar: "/placeholder.svg?height=32&width=32&text=AC",
      role: "Admin",
      businessCount: 2,
    },
    {
      id: "3",
      name: "Startup Project",
      avatar: "/placeholder.svg?height=32&width=32&text=SP",
      role: "Member",
      businessCount: 3,
    },
    {
      id: "4",
      name: "Enterprise Solutions",
      role: "Admin",
      businessCount: 5,
    },
  ]

  const businesses: Business[] = [
    // Businesses for Startup Project (org id: "3")
    { id: "1", name: "TechFlow Solutions", organizationId: "3", status: "active", accountCount: 2 },
    { id: "2", name: "Digital Marketing Co", organizationId: "3", status: "active", accountCount: 2 },
    { id: "3", name: "StartupHub Inc", organizationId: "3", status: "pending", accountCount: 1 },

    // Businesses for Personal Account (org id: "1")
    { id: "4", name: "Personal Projects", organizationId: "1", status: "active", accountCount: 1 },

    // Businesses for Acme Corporation (org id: "2")
    { id: "5", name: "Acme Marketing", organizationId: "2", status: "active", accountCount: 3 },
    { id: "6", name: "Acme Sales", organizationId: "2", status: "active", accountCount: 2 },

    // Businesses for Enterprise Solutions (org id: "4")
    { id: "7", name: "Enterprise Marketing", organizationId: "4", status: "active", accountCount: 5 },
    { id: "8", name: "Enterprise Sales", organizationId: "4", status: "active", accountCount: 4 },
    { id: "9", name: "Enterprise Support", organizationId: "4", status: "active", accountCount: 3 },
    { id: "10", name: "Enterprise Analytics", organizationId: "4", status: "pending", accountCount: 2 },
    { id: "11", name: "Enterprise Growth", organizationId: "4", status: "active", accountCount: 1 },
  ]

  const filteredOrganizations = searchQuery
    ? organizations.filter((org) => org.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : organizations

  // Show businesses for hovered org, or selected org if no hover
  const displayOrgId = hoveredOrgId || selectedOrg.id
  const filteredBusinesses = searchQuery
    ? businesses
        .filter((business) => business.organizationId === displayOrgId)
        .filter((business) => business.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : businesses.filter((business) => business.organizationId === displayOrgId)

  return (
    <div className="relative w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Update the trigger button to remove accountCount */}
          <Button
            variant="outline"
            className="w-full justify-between bg-background border-border text-foreground hover:bg-accent"
          >
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                {selectedOrg.avatar ? (
                  <AvatarImage src={selectedOrg.avatar || "/placeholder.svg"} alt={selectedOrg.name} />
                ) : (
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {selectedOrg.name.charAt(0)}
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
            <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[380px] bg-popover border-border p-0">
          {/* Search */}
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
            {/* Organizations Section */}
            <div className="p-2">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                Organizations
              </DropdownMenuLabel>
              {/* Update the organization items with hover functionality */}
              {filteredOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className={cn(
                    "flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md",
                    selectedOrg.id === org.id ? "bg-accent" : "",
                  )}
                  onMouseEnter={() => setHoveredOrgId(org.id)}
                  onMouseLeave={() => setHoveredOrgId(null)}
                  onClick={() => {
                    setSelectedOrg(org)
                    setSearchQuery("")
                    setHoveredOrgId(null)
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <Avatar className="h-8 w-8 mr-3">
                      {org.avatar ? (
                        <AvatarImage src={org.avatar || "/placeholder.svg"} alt={org.name} />
                      ) : (
                        <AvatarFallback className="bg-muted text-muted-foreground">{org.name.charAt(0)}</AvatarFallback>
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

            {/* Businesses Section - now shows preview on hover */}
            <div className="p-2">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-medium uppercase tracking-wide px-2 py-1">
                {hoveredOrgId
                  ? `${organizations.find((org) => org.id === hoveredOrgId)?.name} Businesses`
                  : "Businesses"}
              </DropdownMenuLabel>
              {filteredBusinesses.map((business) => (
                <DropdownMenuItem
                  key={business.id}
                  className="flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md"
                  onClick={() => {
                    // Navigate to ad accounts page filtered by this business
                    const businessParam = encodeURIComponent(business.name)
                    window.location.href = `/accounts?business=${businessParam}`
                  }}
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

            {/* Quick Actions - simplified */}
            <div className="p-2">
              <DropdownMenuItem className="flex items-center py-2 px-2 cursor-pointer text-popover-foreground hover:bg-accent rounded-md">
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
