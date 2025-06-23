"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../../components/ui/avatar"
import { CheckCircle, Clock, LinkIcon, Search, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { DataTable } from "../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { useAppData } from "../../../contexts/AppDataContext"
import { ApplicationApprovalDialog } from "../../../components/admin/application-approval-dialog"
import { ApplicationReadyDialog } from "../../../components/admin/application-ready-dialog"
import { ApplicationBindingDialog } from "../../../components/admin/application-binding-dialog"
import { toast } from "sonner"

interface Application {
  id: string
  business_id: string
  account_name: string
  spend_limit: number
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  submitted_at: string
  user_email?: string
  user_name?: string
  business_name?: string
  organization_name?: string
  admin_notes?: string
  rejection_reason?: string
}

export default function ApplicationsPage() {
  const { state, adminApproveBusiness } = useAppData()
  
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [readyDialogOpen, setReadyDialogOpen] = useState(false)

  // Fetch applications from backend
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/admin/applications')
        if (!response.ok) {
          throw new Error('Failed to fetch applications')
        }
        const data = await response.json()
        setApplications(data)
      } catch (error) {
        console.error('Error fetching applications:', error)
        toast.error('Failed to load applications')
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])
  
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = statusFilter === "all" || app.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        app.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [applications, statusFilter, searchTerm])

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: {
        label: "Pending",
        color: "bg-red-100 text-red-800 border-red-200",
        icon: CheckCircle,
      },
      under_review: {
        label: "Under Review",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
      },
      approved: {
        label: "Approved",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      rejected: {
        label: "Rejected",
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: LinkIcon,
      },
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.pending
  }

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      under_review: applications.filter((a) => a.status === "under_review").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications],
  )

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: "organization_name",
      header: "Organization",
      size: 300,
      cell: ({ row }) => {
        const app = row.original
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-xs">{app.organization_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{app.organization_name}</div>
              <div className="text-xs text-muted-foreground truncate">{app.business_name}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 160,
      cell: ({ row }) => {
        const statusInfo = getStatusInfo(row.original.status)
        const StatusIcon = statusInfo.icon
        return (
          <Badge className={`text-xs ${statusInfo.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      size: 120,
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.submitted_at), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 140,
      cell: ({ row }) => {
        const app = row.original
        return (
          <div className="flex items-center gap-1">
            {app.status === "pending" && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-7 text-xs text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedApplication(app)
                  setApprovalDialogOpen(true)
                }}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
            )}
            {app.status === "under_review" && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-7 text-xs text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedApplication(app)
                  setReadyDialogOpen(true)
                }}
              >
                <Clock className="h-3 w-3 mr-1" />
                Ready
              </Button>
            )}
            {app.status === "rejected" && (
              <Button
                size="sm"
                className="bg-gray-600 hover:bg-gray-700 h-7 text-xs text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedApplication(app)
                  setBindingDialogOpen(true)
                }}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Reject
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // Handler functions for dialog actions
  const handleApprove = async (applicationId: string) => {
    try {
      // Refresh the applications list after approval
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error refreshing applications:', error)
    }
  };

  const handleMarkReady = async (applicationId: string) => {
    try {
      // Refresh the applications list after marking ready
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error('Error refreshing applications:', error)
    }
  };

  const handleBind = async (data: { teamId: string; businessManagerId: string }) => {
    try {
      // In a real app, this would bind the application to assets
      // For now, we'll just refresh the list
      const response = await fetch('/api/admin/applications')
      if (response.ok) {
        const responseData = await response.json()
        setApplications(responseData)
      }
    } catch (error) {
      console.error('Error refreshing applications:', error)
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading applications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="under_review">Under Review ({stats.under_review})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px]"
            />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">{filteredApplications.length} applications shown</div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredApplications} 
      />

      {/* Dialog Components */}
      <ApplicationApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        application={selectedApplication || { id: "", business_name: "", organization_name: "", spend_limit: 0 }}
        onApprove={handleApprove}
      />

      <ApplicationReadyDialog
        open={readyDialogOpen}
        onOpenChange={setReadyDialogOpen}
        application={selectedApplication || { id: "", business_name: "", organization_name: "", spend_limit: 0 }}
        onMarkReady={handleMarkReady}
      />

      <ApplicationBindingDialog
        open={bindingDialogOpen}
        onOpenChange={setBindingDialogOpen}
        applicationId={selectedApplication?.id || ""}
        onBind={handleBind}
      />
    </div>
  )
} 