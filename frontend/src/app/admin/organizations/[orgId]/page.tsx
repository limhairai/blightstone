"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { DataTable } from "../../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Building, ArrowLeft, Search } from "lucide-react"
import { StatusBadge } from "../../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../../contexts/AuthContext"
import { useParams } from "next/navigation"

interface Business {
  id: string
  name: string
  organizationId: string
  status: "active" | "pending" | "suspended" | "inactive"
  adAccountsCount: number
  totalSpend: number
  monthlyBudget: number
  createdAt: string
}

interface Organization {
  id: string
  name: string
  industry: string
  teamId: string
  status: "active" | "pending" | "suspended" | "inactive"
  plan: "starter" | "professional" | "enterprise"
  adAccountsCount: number
  description?: string
  tags?: string[]
  totalSpend?: number
  balance?: number
  teamMembersCount?: number
}

export default function OrganizationDetailPage() {
  const { session } = useAuth()
  const params = useParams()
  const orgId = params?.orgId as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch organization data
  useEffect(() => {
    async function fetchOrganization() {
      if (!orgId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/organizations/${orgId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Organization not found')
          } else {
            setError('Failed to fetch organization')
          }
          return
        }
        
        const data = await response.json()
        setOrganization(data.organization)
        setBusinesses(data.businesses || [])
      } catch (err) {
        console.error('Error fetching organization:', err)
        setError('Failed to fetch organization')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [orgId])

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const statusFilter = selectedStatus === "all" || business.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        business.name.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [businesses, selectedStatus, searchTerm])

  const columns: ColumnDef<Business>[] = [
    {
      accessorKey: "name",
      header: "Business",
      size: 300,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
            <Building className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.adAccountsCount} ad accounts
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} size="sm" />,
    },
    {
      accessorKey: "totalSpend",
      header: "Total Spend",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.original.totalSpend.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "monthlyBudget",
      header: "Monthly Budget",
      size: 130,
      cell: ({ row }) => (
        <div className="text-right font-medium text-muted-foreground">
          ${row.original.monthlyBudget.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "adAccountsCount",
      header: "Ad Accounts",
      size: 100,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.adAccountsCount}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      size: 50,
      cell: ({ row }) => (
        <Link href={`/admin/organizations/${orgId}/businesses/${row.original.id}`} className="inline-flex">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested organization could not be found.</p>
          <Link href="/admin/organizations">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Organizations
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-lg font-semibold">{organization.name}</h1>
        <StatusBadge status={organization.status} />
        <Badge variant="outline" className="text-xs">
          {organization.industry}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {businesses.length} businesses
        </Badge>
      </div>

      {/* Businesses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Businesses</h2>
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredBusinesses.length} businesses shown
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredBusinesses}
        />
      </div>
    </div>
  )
} 