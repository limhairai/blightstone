"use client"

import { useState } from "react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { PlusIcon, Search, Building2, ExternalLink, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Checkbox } from "../ui/checkbox"
import { StatusBadge } from "../ui/status-badge"
import { StatusDot } from "../ui/status-dot"
import { CreateBusinessDialog } from "./create-business-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Business {
  id: string
  name: string
  businessId: string
  status: "active" | "pending" | "suspended" | "inactive"
  adAccounts: number
  pages: number
  landingPage?: string
  dateCreated: string
  verification: "verified" | "not_verified" | "pending"
}

export function BusinessesView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])

  // Mock data based on the new onboarding workflow - businesses that would be created from onboarding
  const businesses: Business[] = [
    {
      id: "1",
      name: "My E-Commerce Store",
      businessId: "118010225380663",
      status: "active",
      adAccounts: 10,
      pages: 5,
      landingPage: "https://store.example.com",
      dateCreated: "04/10/2025",
      verification: "verified",
    },
    {
      id: "2", 
      name: "Blog Network",
      businessId: "117291547115266",
      status: "pending",
      adAccounts: 0,
      pages: 0,
      landingPage: "https://blog.example.com",
      dateCreated: "04/22/2025",
      verification: "pending",
    },
    {
      id: "3",
      name: "Affiliate Marketing Hub", 
      businessId: "847810749229077",
      status: "active",
      adAccounts: 5,
      pages: 2,
      landingPage: "https://affiliate.example.com",
      dateCreated: "04/18/2025",
      verification: "verified",
    },
    {
      id: "4",
      name: "SaaS Product Launch",
      businessId: "115172833295946",
      status: "pending",
      adAccounts: 0,
      pages: 0,
      landingPage: "https://saas.example.com",
      dateCreated: "04/23/2025",
      verification: "pending",
    },
  ]

  // Filter businesses based on search
  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.businessId.includes(searchQuery) ||
    business.landingPage?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectBusiness = (businessId: string, checked: boolean) => {
    if (checked) {
      setSelectedBusinesses([...selectedBusinesses, businessId])
    } else {
      setSelectedBusinesses(selectedBusinesses.filter((id) => id !== businessId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBusinesses(filteredBusinesses.map((business) => business.id))
    } else {
      setSelectedBusinesses([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Businesses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your Facebook Business Managers and associated ad accounts
          </p>
        </div>
        <CreateBusinessDialog
          trigger={
            <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Business
            </Button>
          }
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      {filteredBusinesses.length === 0 && searchQuery === "" ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No businesses yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">
            Create your first Business Manager to start managing ad accounts.
          </p>
          <CreateBusinessDialog
            trigger={
              <Button className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-white border-0">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Business
              </Button>
            }
          />
        </div>
      ) : (
        /* Businesses Table */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={filteredBusinesses.length > 0 && selectedBusinesses.length === filteredBusinesses.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Business ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ad Accounts</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedBusinesses.includes(business.id)}
                      onCheckedChange={(checked) => handleSelectBusiness(business.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {business.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{business.businessId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusDot status={business.status} />
                      <StatusBadge status={business.status} size="sm" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-6 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 rounded text-sm font-medium">
                      {business.adAccounts}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center w-8 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-sm font-medium">
                      {business.pages}
                    </div>
                  </TableCell>
                  <TableCell>
                    {business.landingPage ? (
                      <div className="flex items-center gap-1 max-w-[200px]">
                        <span className="truncate text-sm">{business.landingPage}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{business.dateCreated}</TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={business.verification === "verified" ? "active" : business.verification === "pending" ? "pending" : "inactive"} 
                      size="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Manage Pages</DropdownMenuItem>
                        <DropdownMenuItem>View Ad Accounts</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Business</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Suspend Business</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Results Summary */}
      {filteredBusinesses.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </div>
      )}
    </div>
  )
} 