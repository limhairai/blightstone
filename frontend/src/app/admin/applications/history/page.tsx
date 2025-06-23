"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { DataTable } from "../../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Search } from "lucide-react"

interface ApplicationHistory {
  id: string
  organizationName: string
  businessName: string
  applicationType: "new_business" | "additional_business"
  accountsRequested: number
  status: "approved" | "rejected" | "completed"
  teamName: string
  processedAt: string
  completedAt?: string
}

export default function ApplicationHistoryPage() {
  const [applications] = useState<ApplicationHistory[]>([
    {
      id: "app-h-001",
      organizationName: "TechCorp Solutions",
      businessName: "TechCorp Marketing",
      applicationType: "new_business",
      accountsRequested: 3,
      status: "completed",
      teamName: "Team Alpha",
      processedAt: "2024-01-10T10:30:00Z",
      completedAt: "2024-01-12T15:45:00Z"
    },
    {
      id: "app-h-002",
      organizationName: "Digital Pro Agency",
      businessName: "DPA Campaigns",
      applicationType: "additional_business",
      accountsRequested: 2,
      status: "approved",
      teamName: "Team Beta",
      processedAt: "2024-01-08T14:20:00Z"
    }
  ])

  const [searchTerm, setSearchTerm] = useState("")

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = searchTerm === "" || 
        app.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [applications, searchTerm])

  const columns: ColumnDef<ApplicationHistory>[] = [
    {
      accessorKey: "organizationName",
      header: "Organization",
      size: 200,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.organizationName}</div>
          <div className="text-sm text-muted-foreground">{row.original.businessName}</div>
        </div>
      ),
    },
    {
      accessorKey: "applicationType",
      header: "Type",
      size: 120,
      cell: ({ row }) => (
        <Badge
          variant={row.original.applicationType === "new_business" ? "default" : "secondary"}
          className="capitalize"
        >
          {row.original.applicationType === "new_business" ? "New" : "Additional"}
        </Badge>
      ),
    },
    {
      accessorKey: "accountsRequested",
      header: "Accounts",
      size: 100,
      cell: ({ row }) => <div className="text-center">{row.original.accountsRequested}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue<string>("status")
        return (
          <Badge 
            variant={status === "completed" ? "default" : status === "approved" ? "secondary" : "destructive"}
            className="capitalize"
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "teamName",
      header: "Team",
      size: 120,
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.teamName}
        </Badge>
      ),
    },
    {
      accessorKey: "processedAt",
      header: "Processed",
      size: 120,
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("processedAt"))
        return formatDistanceToNow(date, { addSuffix: true })
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search application history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            {filteredApplications.length} of {applications.length} applications shown
          </div>
        </div>
        
        <Button variant="outline" size="sm">
          Export Report
        </Button>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredApplications} 
      />
    </div>
  )
} 