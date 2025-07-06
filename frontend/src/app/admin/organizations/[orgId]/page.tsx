"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { DataTable } from "../../../../components/ui/data-table"
import { Building, ArrowLeft, Search, RefreshCw } from "lucide-react"
import { StatusBadge } from "../../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../../contexts/AuthContext"
import { useParams } from "next/navigation"

interface BusinessManager {
  id: string
  name: string
  status: "active" | "pending" | "suspended" | "inactive"
  organizationId: string
  adAccountsCount: number
  dolphin_business_manager_id: string
  totalSpend: number
  monthlyBudget: number
  createdAt: string
}

interface Organization {
  id: string
  name: string
  created_at: string
}

export default function OrganizationDetailPage() {
  const { session } = useAuth()
  const params = useParams()
  const orgId = params?.orgId as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    if (!session?.access_token || !orgId) return

    setLoading(true)
    try {
      // Fetch organization details
      const orgResponse = await fetch(`/api/admin/organizations/${orgId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (!orgResponse.ok) {
        throw new Error('Failed to fetch organization')
      }
      
      const orgData = await orgResponse.json()
      setOrganization(orgData.organization)
      
      // Business managers are already included in the organization response
      setBusinessManagers(orgData.businessManagers || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [session, orgId])

  const filteredBusinessManagers = useMemo(() => {
    return businessManagers.filter((bm) => {
      const statusFilter = selectedStatus === "all" || bm.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bm.dolphin_business_manager_id?.includes(searchTerm)
      return statusFilter && searchFilter
    })
  }, [businessManagers, selectedStatus, searchTerm])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading organization...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  if (!organization) {
    return <div className="flex items-center justify-center p-8">Organization not found</div>
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Business Manager",
      size: 300,
      cell: ({ row }: { row: { original: BusinessManager; getValue: (key: string) => any } }) => (
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
      accessorKey: "dolphin_business_manager_id",
      header: "Business Manager ID",
      size: 200,
      cell: ({ row }: { row: { original: BusinessManager } }) => (
        <div className="font-mono text-sm">
          {row.original.dolphin_business_manager_id ? 
            `${row.original.dolphin_business_manager_id.substring(0, 12)}...` : 
            'N/A'
          }
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => <StatusBadge status={row.getValue("status")} size="sm" />,
    },
    {
      accessorKey: "adAccountsCount",
      header: "Ad Accounts",
      size: 120,
      cell: ({ row }: { row: { original: BusinessManager } }) => (
        <div className="text-center font-medium">
          {row.original.adAccountsCount}
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      size: 50,
      cell: ({ row }: { row: { original: BusinessManager } }) => (
        <Link href={`/admin/organizations/${orgId}/business-managers/${row.original.id}`}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">
            Organization ID: <span className="font-mono">{organization.id}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Business Managers</h2>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
            
            <div className="text-sm text-muted-foreground">
              {filteredBusinessManagers.length} business managers shown
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredBusinessManagers}
          searchKey="name"
          searchPlaceholder="Search business managers..."
        />
      </div>
    </div>
  )
} 