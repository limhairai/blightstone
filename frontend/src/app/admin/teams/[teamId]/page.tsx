"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { DataTable } from "../../../../components/ui/data-table"
import { Building2, ArrowLeft, Search } from "lucide-react"
import { StatusBadge } from "../../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../../contexts/AuthContext"
import { useParams } from "next/navigation"

interface Organization {
  id: string
  name: string
  industry: string
  teamId: string
  status: "active" | "pending" | "suspended" | "inactive"
  plan: "starter" | "professional" | "enterprise"
  adAccountsCount: number
}

interface Team {
  id: string
  name: string
  description: string
  organizationsCount: number
  activeBusinesses: number
  utilizationRate: number
  capacity: number
  status: "active" | "at_capacity" | "needs_backup" | "suspended"
}

export default function TeamDetailPage() {
  const { session } = useAuth()
  const params = useParams()
  const teamId = params?.teamId as string
  
  // Mock teams data
  const teams: Team[] = [
    {
      id: "team-1",
      name: "Team Alpha",
      description: "Primary operations team",
      organizationsCount: 15,
      activeBusinesses: 45,
      utilizationRate: 75,
      capacity: 20,
      status: "active"
    },
    {
      id: "team-2", 
      name: "Team Beta",
      description: "Enterprise accounts team",
      organizationsCount: 19,
      activeBusinesses: 62,
      utilizationRate: 95,
      capacity: 20,
      status: "at_capacity"
    },
    {
      id: "team-3",
      name: "Team Gamma",
      description: "Small business team",
      organizationsCount: 12,
      activeBusinesses: 28,
      utilizationRate: 60,
      capacity: 20,
      status: "needs_backup"
    }
  ]

  // Mock organizations data
  const [organizations] = useState<Organization[]>([
    {
      id: "org-1",
      name: "TechCorp Solutions",
      industry: "Technology",
      teamId: "team-1",
      status: "active",
      plan: "professional",
      adAccountsCount: 12
    },
    {
      id: "org-2",
      name: "Digital Marketing Pro",
      industry: "Marketing",
      teamId: "team-2", 
      status: "active",
      plan: "enterprise",
      adAccountsCount: 25
    },
    {
      id: "org-3",
      name: "E-commerce Plus",
      industry: "E-commerce",
      teamId: "team-1",
      status: "pending",
      plan: "starter",
      adAccountsCount: 5
    },
    {
      id: "org-4",
      name: "StartupCo",
      industry: "Technology",
      teamId: "team-1",
      status: "active",
      plan: "professional",
      adAccountsCount: 8
    },
    {
      id: "org-5",
      name: "Marketing Hub",
      industry: "Marketing",
      teamId: "team-3",
      status: "active",
      plan: "enterprise",
      adAccountsCount: 18
    },
    {
      id: "org-6",
      name: "Creative Agency",
      industry: "Design",
      teamId: "team-2",
      status: "suspended",
      plan: "professional",
      adAccountsCount: 7
    }
  ])

  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const currentTeam = teams.find(t => t.id === teamId)
  const teamOrganizations = organizations.filter(org => org.teamId === teamId)

  const filteredOrganizations = useMemo(() => {
    return teamOrganizations.filter((org) => {
      const statusFilter = selectedStatus === "all" || org.status === selectedStatus
      const planFilter = selectedPlan === "all" || org.plan === selectedPlan
      const searchFilter = searchTerm === "" || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && planFilter && searchFilter
    })
  }, [teamOrganizations, selectedStatus, selectedPlan, searchTerm])

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
        <Link href={`/admin/teams/${teamId}/organizations/${row.original.id}`} className="inline-flex">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ]

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Team Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested team could not be found.</p>
          <Link href="/admin/teams">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/teams">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{currentTeam.name}</h1>
          <p className="text-sm text-muted-foreground">{currentTeam.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">Organizations</div>
          <div className="text-2xl font-bold">{currentTeam.organizationsCount}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">Active Businesses</div>
          <div className="text-2xl font-bold">{currentTeam.activeBusinesses}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">Utilization</div>
          <div className="text-2xl font-bold">{currentTeam.utilizationRate}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground">Capacity</div>
          <div className="text-2xl font-bold">{currentTeam.capacity}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Organizations</h2>
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
            
            <div className="text-sm text-muted-foreground">
              {filteredOrganizations.length} organizations shown
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrganizations}
          searchKey="name"
          searchPlaceholder="Search organizations..."
        />
      </div>
    </div>
  )
} 