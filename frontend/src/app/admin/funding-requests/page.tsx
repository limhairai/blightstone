"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../../components/ui/avatar"
import { CheckCircle, XCircle, Clock, Search, Filter, DollarSign } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { DataTable } from "../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { formatCurrency } from "../../../utils/format"

interface FundingRequest {
  id: string
  account_id: string
  account_name: string
  requested_amount: number
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  user_email: string
  user_name: string
  organization_id: string
  admin_notes?: string
  approved_amount?: number
  approved_at?: string
  rejected_at?: string
  rejection_reason?: string
}

export default function FundingRequestsPage() {
  const [requests, setRequests] = useState<FundingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [adminNotes, setAdminNotes] = useState("")
  const [approvedAmount, setApprovedAmount] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch funding requests
  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/funding-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error fetching funding requests:', error)
      toast.error('Failed to load funding requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedRequest) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/funding-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: actionType,
          admin_notes: adminNotes,
          approved_amount: actionType === 'approve' ? parseFloat(approvedAmount) || selectedRequest.requested_amount : undefined,
          rejection_reason: actionType === 'reject' ? rejectionReason : undefined
        }),
      })

      if (response.ok) {
        toast.success(`Funding request ${actionType}d successfully!`)
        setActionDialogOpen(false)
        setSelectedRequest(null)
        setAdminNotes("")
        setApprovedAmount("")
        setRejectionReason("")
        fetchRequests() // Refresh the list
      } else {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${actionType} request`)
      }
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${actionType} request`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openActionDialog = (request: FundingRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setApprovedAmount(request.requested_amount.toString())
    setActionDialogOpen(true)
  }



  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const columns: ColumnDef<FundingRequest>[] = [
    {
      accessorKey: "id",
      header: "Request ID",
      size: 150,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="min-w-0">
            <div className="font-mono text-sm">{request.id}</div>
            <div className="text-xs text-gray-500 truncate">{request.user_name}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "account_name",
      header: "Account",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="min-w-0">
            <div className="font-medium truncate">{request.account_name}</div>
            <div className="text-sm text-gray-500 font-mono">{request.account_id}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "requested_amount",
      header: "Amount",
      size: 100,
      cell: ({ row }) => (
        <div className="font-medium text-green-600">
          {formatCurrency(row.original.requested_amount)}
        </div>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: 200,
      cell: ({ row }) => (
        <div className="truncate max-w-[200px]" title={row.original.notes}>
          {row.original.notes || 'No notes'}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "submitted_at",
      header: "Submitted",
      size: 120,
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDistanceToNow(new Date(row.original.submitted_at), { addSuffix: true })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        if (request.status !== 'pending') {
          return <div className="text-sm text-gray-500">No actions available</div>
        }
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => openActionDialog(request, 'approve')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => openActionDialog(request, 'reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Stats for the header
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalAmount: requests
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + r.requested_amount, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funding Requests</h1>
          <p className="text-gray-600 mt-1">
            Manage client requests for ad account funding
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalAmount)}</div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border">
        <DataTable
          columns={columns}
          data={filteredRequests}
          loading={loading}
        />
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Funding Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Account</Label>
                    <p>{selectedRequest.account_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Requested Amount</Label>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedRequest.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Reason</Label>
                    <p>{selectedRequest.reason}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Priority</Label>
                    <div>{getUrgencyBadge(selectedRequest.urgency)}</div>
                  </div>
                </div>
                {selectedRequest.campaign_details && (
                  <div className="mt-3">
                    <Label className="font-medium">Campaign Details</Label>
                    <p className="text-sm mt-1">{selectedRequest.campaign_details}</p>
                  </div>
                )}
              </div>

              {actionType === 'approve' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="approvedAmount">Approved Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="approvedAmount"
                        type="number"
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        placeholder="Enter approved amount"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes about this approval..."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this request is being rejected..."
                      rows={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                isSubmitting ||
                (actionType === 'approve' && !approvedAmount) ||
                (actionType === 'reject' && !rejectionReason.trim())
              }
              className={
                actionType === 'approve'
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'approve' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 