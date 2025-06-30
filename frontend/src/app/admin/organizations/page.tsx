"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Building2, Search } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"
import { StatusBadge } from "../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../contexts/AuthContext"

interface Organization {
  organization_id: string
  name: string
  // These fields are not in the new API response, so they are optional or removed.
  teamId?: string
  status?: "active" | "pending" | "suspended" | "inactive"
  plan?: "starter" | "professional" | "enterprise"
  industry?: string;
  adAccountsCount?: number
}

export default function OrganizationsPage() {
  const { session } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch real organizations data
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!session?.access_token) return

      try {
        // Admins should fetch from the dedicated admin endpoint.
        const response = await fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch organizations')
        }
        
        const data = await response.json()
        setOrganizations(data.organizations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [session])

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const teamFilter = selectedTeam === "all" || org.teamId === selectedTeam
      const statusFilter = selectedStatus === "all" || org.status === selectedStatus
      const planFilter = selectedPlan === "all" || org.plan === selectedPlan
      const searchFilter = searchTerm === "" || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.teamId?.toLowerCase().includes(searchTerm.toLowerCase())

      return teamFilter && statusFilter && planFilter && searchFilter
    })
  }, [organizations, selectedTeam, selectedStatus, selectedPlan, searchTerm])
  
  // For now, use mock teams data - in production this would also come from API
  const teams = [
    { id: "team-1", name: "Team Alpha" },
    { id: "team-2", name: "Team Beta" },
    { id: "team-3", name: "Team Gamma" }
  ]
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading organizations...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Organization",
      size: 250,
      cell: ({ row }: { row: { original: Organization; getValue: (key: string) => any } }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground truncate">{row.original.industry}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "teamName",
      header: "Team",
      size: 110,
      cell: ({ row }: { row: { original: Organization } }) => (
        <Badge variant="outline" className="truncate">
          {teams.find((t) => t.id === row.original.teamId)?.name || "Unknown Team"}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => <StatusBadge status={row.getValue("status")} size="sm" />,
    },
    {
      accessorKey: "plan",
      header: "Plan",
      size: 120,
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
        <Badge variant="secondary" className="truncate capitalize">
          {row.getValue("plan")}
        </Badge>
      ),
    },
    {
      accessorKey: "adAccountsCount",
      header: "Accounts",
      size: 80,
      cell: ({ row }: { row: { original: Organization } }) => <div className="text-center font-medium">{row.original.adAccountsCount}</div>,
    },
    {
      accessorKey: "actions",
      header: "",
      size: 50,
      cell: ({ row }: { row: { original: Organization } }) => (
        <Link href={`/admin/organizations/${row.original.organization_id}`} className="inline-flex">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">{filteredOrganizations.length} organizations total</div>
      </div>

      <DataTable
        columns={columns}
        data={filteredOrganizations}
        searchKey="name"
        searchPlaceholder="Search organizations..."
      />
    </div>
  )
} 