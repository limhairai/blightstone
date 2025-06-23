"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { DataTable } from "../../../../components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import type { ColumnDef } from "@tanstack/react-table"
import { Building, ArrowLeft, Search, Users, DollarSign, BarChart3 } from "lucide-react"
import { StatusBadge } from "../../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import { QuickActions } from "../../../../components/admin/quick-actions"
import { TagsCard } from "../../../../components/admin/tags-card"
import { AdminOrgTasks } from "../../../../components/admin/admin-org-tasks"
import { AdminOrgTeamTable } from "../../../../components/admin/admin-org-team-table"
import Link from "next/link"
import { useAppData } from "../../../../contexts/AppDataContext"
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
  const { state } = useAppData()
  const params = useParams()
  const orgId = params?.orgId as string
  
  // Mock organizations data with enhanced properties
  const organizations: Organization[] = [
    {
      id: "org-1",
      name: "TechCorp Solutions",
      industry: "Technology",
      teamId: "team-1",
      status: "active",
      plan: "professional",
      adAccountsCount: 12,
      description: "Leading technology solutions provider specializing in enterprise software and cloud services.",
      tags: ["Enterprise", "B2B", "SaaS", "Cloud"],
      totalSpend: 45000,
      balance: 12500,
      teamMembersCount: 8
    },
    {
      id: "org-2",
      name: "Digital Marketing Pro",
      industry: "Marketing",
      teamId: "team-2", 
      status: "active",
      plan: "enterprise",
      adAccountsCount: 25,
      description: "Full-service digital marketing agency helping brands grow their online presence.",
      tags: ["Marketing", "Agency", "Growth", "Digital"],
      totalSpend: 78000,
      balance: 25000,
      teamMembersCount: 15
    },
    {
      id: "org-3",
      name: "E-commerce Plus",
      industry: "E-commerce",
      teamId: "team-1",
      status: "pending",
      plan: "starter",
      adAccountsCount: 5,
      description: "E-commerce solutions for small to medium businesses.",
      tags: ["E-commerce", "Retail", "SMB"],
      totalSpend: 12000,
      balance: 3500,
      teamMembersCount: 3
    },
    {
      id: "org-4",
      name: "StartupCo",
      industry: "Technology",
      teamId: "team-1",
      status: "active",
      plan: "professional",
      adAccountsCount: 8,
      description: "Innovative startup focused on AI and machine learning solutions.",
      tags: ["Startup", "AI", "ML", "Innovation"],
      totalSpend: 28000,
      balance: 8500,
      teamMembersCount: 5
    },
    {
      id: "org-5",
      name: "Marketing Hub",
      industry: "Marketing",
      teamId: "team-3",
      status: "active",
      plan: "enterprise",
      adAccountsCount: 18,
      description: "Marketing automation and analytics platform.",
      tags: ["MarTech", "Analytics", "Automation"],
      totalSpend: 65000,
      balance: 18000,
      teamMembersCount: 12
    },
    {
      id: "org-6",
      name: "Creative Agency",
      industry: "Design",
      teamId: "team-2",
      status: "suspended",
      plan: "professional",
      adAccountsCount: 7,
      description: "Creative design agency specializing in brand identity and digital experiences.",
      tags: ["Creative", "Design", "Branding"],
      totalSpend: 22000,
      balance: 5500,
      teamMembersCount: 6
    }
  ]

  // Mock businesses data
  const [businesses] = useState<Business[]>([
    {
      id: "biz-1",
      name: "TechCorp Main Campaign",
      organizationId: "org-1",
      status: "active",
      adAccountsCount: 5,
      totalSpend: 12500,
      monthlyBudget: 15000,
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      id: "biz-2",
      name: "TechCorp Product Launch",
      organizationId: "org-1",
      status: "active",
      adAccountsCount: 4,
      totalSpend: 8200,
      monthlyBudget: 10000,
      createdAt: "2024-01-10T14:20:00Z"
    },
    {
      id: "biz-3",
      name: "TechCorp Brand Awareness",
      organizationId: "org-1",
      status: "pending",
      adAccountsCount: 3,
      totalSpend: 3500,
      monthlyBudget: 5000,
      createdAt: "2024-01-12T09:15:00Z"
    },
    {
      id: "biz-4",
      name: "Digital Pro Lead Gen",
      organizationId: "org-2",
      status: "active",
      adAccountsCount: 8,
      totalSpend: 25000,
      monthlyBudget: 30000,
      createdAt: "2024-01-08T11:45:00Z"
    },
    {
      id: "biz-5",
      name: "Digital Pro Retargeting",
      organizationId: "org-2",
      status: "active",
      adAccountsCount: 6,
      totalSpend: 18500,
      monthlyBudget: 20000,
      createdAt: "2024-01-05T16:30:00Z"
    },
    {
      id: "biz-6",
      name: "E-commerce Holiday Campaign",
      organizationId: "org-3",
      status: "suspended",
      adAccountsCount: 2,
      totalSpend: 5500,
      monthlyBudget: 8000,
      createdAt: "2024-01-03T13:20:00Z"
    }
  ])

  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const currentOrganization = organizations.find(o => o.id === orgId)
  const organizationBusinesses = businesses.filter(biz => biz.organizationId === orgId)

  const filteredBusinesses = useMemo(() => {
    return organizationBusinesses.filter((business) => {
      const statusFilter = selectedStatus === "all" || business.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        business.name.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [organizationBusinesses, selectedStatus, searchTerm])

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

  if (!currentOrganization) {
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
        <h1 className="text-lg font-semibold">{currentOrganization.name}</h1>
        <StatusBadge status={currentOrganization.status} />
        <Badge variant="outline" className="text-xs">
          {currentOrganization.industry}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {organizationBusinesses.length} businesses
        </Badge>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">${currentOrganization.totalSpend?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">${currentOrganization.balance?.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{currentOrganization.teamMembersCount}</div>
                <p className="text-xs text-muted-foreground">Active members</p>
              </CardContent>
            </Card>
          </div>

          {/* Organization Description */}
          {currentOrganization.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{currentOrganization.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions org={currentOrganization} />
            </CardContent>
          </Card>

          {/* Tags */}
          <TagsCard 
            tags={currentOrganization.tags || []} 
            orgId={currentOrganization.id}
          />

          {/* Tasks */}
          <AdminOrgTasks 
            orgId={currentOrganization.id} 
            isSuperuser={state.userRole === 'superuser'}
          />
        </div>
      </div>

      {/* Team Members */}
      <AdminOrgTeamTable orgId={currentOrganization.id} />

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