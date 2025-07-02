"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { useOrganizationStore } from "../../../lib/stores/organization-store"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Input } from "../../../components/ui/input"
import { DataTable } from "../../../components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Search, Clock, CheckCircle, X, Eye, LayoutGrid, DollarSign } from "lucide-react"
import { formatCurrency } from "../../../utils/format"
import { toast } from "sonner"
import type { TopupRequest, TopupRequestStatus } from "../../../types/topup-request"
import { useSWRConfig } from 'swr'

export default function ClientTopupRequestsPage() {
  const { session } = useAuth()
  const { mutate } = useSWRConfig()
  const { currentOrganizationId } = useOrganizationStore()
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  // Set the page title
  useEffect(() => {
    document.title = "Top-up Requests | AdHub"
  }, [])

  useEffect(() => {
    if (currentOrganizationId && session?.access_token) {
      fetchRequests()
    }
  }, [currentOrganizationId, session?.access_token])

  const fetchRequests = async () => {
    try {
      // Use the correct API endpoint that returns enriched data
      const response = await fetch('/api/topup-requests', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch top-up requests')
      }
      
      const data = await response.json()
      // The API returns an array directly, not wrapped in a requests property
      setRequests(Array.isArray(data) ? data : data.requests || [])
    } catch (err) {
      console.error('Error fetching top-up requests:', err)
      toast.error('Failed to load top-up requests')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        (request.ad_account_name && request.ad_account_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.metadata?.business_manager_name && request.metadata.business_manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesStatus && matchesSearch
    })
  }, [requests, statusFilter, searchTerm])

  const getStatusConfig = (status: TopupRequestStatus) => {
    switch (status) {
      case 'pending':
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800", icon: Clock }
      case 'processing':
        return { color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800", icon: Clock }
      case 'completed':
        return { color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", icon: CheckCircle }
      case 'failed':
        return { color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", icon: X }
      case 'cancelled':
        return { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", icon: X }
      default:
        return { color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", icon: Clock }
    }
  }

  const handleViewDetails = (request: TopupRequest) => {
    setSelectedRequest(request)
    setShowDetailsDialog(true)
  }

  const handleCancelRequest = async (request: TopupRequest) => {
    try {
      const response = await fetch(`/api/topup-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel request');
      }

      // Refresh the requests list
      await fetchRequests();
      
      // Refresh wallet balance and organization data
      if (currentOrganizationId) {
        await Promise.all([
          mutate(`/api/organizations?id=${currentOrganizationId}`),
          mutate('/api/organizations'),
          mutate(`org-${currentOrganizationId}`)
        ]);
      }
      
      toast.success("Request cancelled successfully");
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request');
    }
  }

  const columns: ColumnDef<TopupRequest>[] = [
    {
      accessorKey: "ad_account_name",
      header: "Account Details",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {request.ad_account_name && request.ad_account_name !== 'Account Name Not Available' 
                ? request.ad_account_name 
                : 'Account Name Unavailable'}
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {request.ad_account_id && request.ad_account_id !== 'Account ID Not Available' 
                ? request.ad_account_id 
                : 'ID Unavailable'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "business_manager",
      header: "Business Manager",
      size: 180,
      cell: ({ row }) => {
        const request = row.original
        const bmName = request.metadata?.business_manager_name
        return (
          <div className="text-sm">
            {bmName && bmName !== 'BM Not Available' ? bmName : 'Not Available'}
          </div>
        )
      },
    },
    {
      accessorKey: "bm_id",
      header: "BM ID",
      size: 120,
      cell: ({ row }) => {
        const request = row.original
        const bmId = request.metadata?.business_manager_id
        return (
          <div className="text-xs text-muted-foreground font-mono">
            {bmId && bmId !== 'BM ID Not Available' ? bmId : 'Not Available'}
          </div>
        )
      },
    },
    {
      accessorKey: "amount_cents",
      header: "Amount",
      size: 120,
      cell: ({ row }) => {
        const amountCents = row.getValue<number>("amount_cents")
        return (
          <div className="font-medium text-[#34D197]">
            {formatCurrency(amountCents / 100)}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue<TopupRequestStatus>("status")
        const config = getStatusConfig(status)
        const Icon = config.icon
        return (
          <Badge className={`capitalize ${config.color} flex items-center gap-1`}>
            <Icon className="h-3 w-3" />
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Requested",
      size: 120,
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("created_at"))
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 100,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(request)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelRequest(request)}
              >
                Cancel
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // Status filter options
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <DollarSign className="h-4 w-4 mr-2" />
              Top-up Requests
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading top-up requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - matching accounts page style */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-foreground bg-accent">
            <DollarSign className="h-4 w-4 mr-2" />
            Top-up Requests
          </Button>
        </div>
      </div>

      {/* Filters Bar - matching accounts page style */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 border-b border-border">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Status:
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
            <Input
            placeholder="Search accounts, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent"
            />
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground whitespace-nowrap ml-auto">
          {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} shown
        </div>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns} 
        data={filteredRequests}
        searchableColumns={[
          {
            id: "ad_account_name",
            title: "Account Name",
          },
        ]}
        enableColumnVisibility={false}
      />

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Top-up Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Request ID</Label>
                  <div className="font-mono text-sm">{selectedRequest.id}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {(() => {
                      const config = getStatusConfig(selectedRequest.status)
                      const Icon = config.icon
                      return (
                        <Badge className={`capitalize ${config.color} flex items-center gap-1 w-fit`}>
                          <Icon className="h-3 w-3" />
                          {selectedRequest.status}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Account Information */}
                <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Information</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account Name:</span>
                    <span className="text-sm font-medium">{selectedRequest.ad_account_name || 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Account ID:</span>
                    <span className="text-sm font-mono">{selectedRequest.ad_account_id || 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Business Manager:</span>
                    <span className="text-sm font-medium">{selectedRequest.metadata?.business_manager_name || 'Not Available'}</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">BM ID:</span>
                    <span className="text-sm font-mono">{selectedRequest.metadata?.business_manager_id || 'Not Available'}</span>
                  </div>
                </div>
              </div>

              {/* Request Details */}
                <div>
                <Label className="text-sm font-medium text-muted-foreground">Request Details</Label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(selectedRequest.amount_cents / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Requested:</span>
                    <span className="text-sm">{formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true })}</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Requested By:</span>
                    <span className="text-sm">{selectedRequest.requested_by_user?.email || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Admin Notes</Label>
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">{selectedRequest.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 