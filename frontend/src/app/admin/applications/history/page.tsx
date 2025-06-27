"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "../../../../contexts/AuthContext"
import { toast } from "sonner"
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
  const { session } = useAuth()
  const [applications, setApplications] = useState<ApplicationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch applications history
  useEffect(() => {
    const fetchApplicationsHistory = async () => {
      if (!session?.access_token) return

      try {
        const response = await fetch('/api/admin/applications?status=approved,rejected,completed', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch applications history')
        }
        
        const data = await response.json()
        // Transform the data to match the history format
        const historyData = data.map((app: any) => ({
          id: app.id,
          organizationName: app.organization_name,
          businessName: app.business_name,
          applicationType: "new_business", // Default for now
          accountsRequested: 1, // Default for now
          status: app.status,
          teamName: "Team Alpha", // Default for now
          processedAt: app.submitted_at,
          completedAt: app.approved_at || app.rejected_at
        }))
        setApplications(historyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load applications history')
        toast.error('Failed to load applications history')
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationsHistory()
  }, [session])

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch = searchTerm === "" || 
        app.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.teamName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [applications, searchTerm])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading applications history...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

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