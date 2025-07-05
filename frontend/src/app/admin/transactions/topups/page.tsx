"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react"
import { useAuth } from "../../../../contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { DataTable } from "../../../../components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog"
import { Textarea } from "../../../../components/ui/textarea"
import { Label } from "../../../../components/ui/label"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Clock, X, Search, AlertCircle, DollarSign, User, Calendar, MessageSquare, Eye } from "lucide-react"
import { formatCurrency } from "../../../../utils/format"
import type { TopupRequest, TopupRequestStatus } from "../../../../types/topup-request"

export default function TopupRequestsPage() {
  const { session } = useAuth()
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<TopupRequestStatus>('processing')
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Fetch top-up requests
  useEffect(() => {
    if (session?.access_token) {
      fetchRequests()
    }
  }, [session])

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/topup-requests', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch top-up requests')
      }
      
      const data = await response.json()
      setRequests(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top-up requests')
      toast.error('Failed to load top-up requests')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        request.ad_account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.organization?.name && request.organization.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.display_id && request.display_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.id && request.id.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesStatus && matchesSearch
    })
  }, [requests, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    processing: requests.filter(r => r.status === "processing").length,
    completed: requests.filter(r => r.status === "completed").length,
    failed: requests.filter(r => r.status === "failed").length,
    cancelled: requests.filter(r => r.status === "cancelled").length,
  }), [requests])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading top-up requests...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const handleProcessRequest = async (request: TopupRequest, status: TopupRequestStatus, notes?: string) => {
    // OPTIMISTIC UPDATE: Immediately update the UI
    const optimisticRequest = {
      ...request,
      status,
      admin_notes: notes || '',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update local state immediately
    setRequests(prev => prev.map(req => 
      req.id === request.id ? optimisticRequest : req
    ));

    const statusMessages = {
      processing: 'Request marked as processing',
      completed: 'Request completed successfully',
      failed: 'Request marked as failed',
      cancelled: 'Request cancelled'
    };

    // Show success immediately
    toast.success(statusMessages[status] || 'Request updated');
    setShowProcessDialog(false);
    setSelectedRequest(null);
    setAdminNotes('');

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/topup-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status,
          admin_notes: notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }

      // Background sync with server data
      const updatedRequest = await response.json();
      setRequests(prev => prev.map(req => 
        req.id === request.id ? updatedRequest : req
      ));
      
    } catch (err) {
      // Revert optimistic update on error
      setRequests(prev => prev.map(req => 
        req.id === request.id ? request : req
      ));
      toast.error(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (request: TopupRequest, status: TopupRequestStatus) => {
    setSelectedRequest(request)
    setProcessingStatus(status)
    setAdminNotes('')
    setShowProcessDialog(true)
  }

  const getStatusConfig = (status: TopupRequestStatus) => {
    switch (status) {
      case 'pending':
        return { color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800", icon: Clock }
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: "bg-red-500/20 text-red-500 border-red-500" }
      case 'high':
        return { color: "bg-orange-500/20 text-orange-500 border-orange-500" }
      case 'normal':
        return { color: "bg-blue-500/20 text-blue-500 border-blue-500" }
      case 'low':
        return { color: "bg-gray-500/20 text-gray-500 border-gray-500" }
      default:
        return { color: "bg-blue-500/20 text-blue-500 border-blue-500" }
    }
  }

  const columns: ColumnDef<TopupRequest>[] = [
    {
      accessorKey: "display_id",
      header: "Request ID",
      size: 100,
      cell: ({ row }) => {
        const displayId = row.getValue<string>("display_id")
        const id = row.original.id
        return (
          <div className="space-y-1">
            {displayId ? (
              <>
                <div className="font-mono text-sm font-medium">{displayId}</div>
                {id && (
                  <div className="font-mono text-xs text-muted-foreground">
                    {id.substring(0, 8)}...
                  </div>
                )}
              </>
            ) : (
              <div className="font-mono text-xs text-muted-foreground">
                {id ? `${id.substring(0, 8)}...` : 'No ID'}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "ad_account_name",
      header: "Account Details",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{request.ad_account_name || 'No Account Name'}</div>
            <div className="text-xs text-muted-foreground">ID: {request.ad_account_id || 'No Account ID'}</div>
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
        // Parse BM info from metadata if available
        const bmName = request.metadata?.business_manager_name || 'Not Available'
        return (
          <div className="text-sm">
            {bmName}
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
        const bmId = request.metadata?.business_manager_id || 'Not Available'
        return (
          <div className="text-xs text-muted-foreground font-mono">
            {bmId}
          </div>
        )
      },
    },
    {
      accessorKey: "amount_cents",
      header: "Top-up Amount",
      size: 120,
      cell: ({ row }) => {
        const request = row.original
        const amountCents = request.amount_cents
        
        return (
          <div className="font-medium text-green-600 dark:text-green-400">
            {formatCurrency(amountCents / 100)}
          </div>
        )
      },
    },
    {
      accessorKey: "fee_amount_cents",
      header: "Fees",
      size: 100,
      cell: ({ row }) => {
        const request = row.original
        const feeAmountCents = request.fee_amount_cents || 0
        const feePercentage = request.plan_fee_percentage || 0
        
        return (
          <div className="text-sm">
            {feeAmountCents > 0 ? (
              <div className="text-muted-foreground">
                {formatCurrency(feeAmountCents / 100)}
                <div className="text-xs">({feePercentage}%)</div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">No fee</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "total_deducted_cents",
      header: "Total Deducted",
      size: 120,
      cell: ({ row }) => {
        const request = row.original
        const totalDeductedCents = request.total_deducted_cents || request.amount_cents
        
        return (
          <div className="font-medium text-foreground">
            {formatCurrency(totalDeductedCents / 100)}
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
      accessorKey: "requested_by_user",
      header: "Requested By",
      size: 150,
      cell: ({ row }) => {
        const user = row.original.requested_by_user
        const orgName = row.original.organization?.name || 'Unknown Organization'
        return (
          <div className="space-y-1">
            <div className="text-sm">{user?.email || 'Unknown User'}</div>
            <div className="text-xs text-muted-foreground">{orgName}</div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        
        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(request)
                setShowDetailsDialog(true)
              }}
              className="h-7 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            
            {request.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'processing')}
                  className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Process
                </Button>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'completed')}
                  className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Button>
              </>
            )}
            
            {request.status === "processing" && (
              <>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'completed')}
                  className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openProcessDialog(request, 'failed')}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Fail
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({stats.total})</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
              <SelectItem value="processing">Processing ({stats.processing})</SelectItem>
              <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
              <SelectItem value="failed">Failed ({stats.failed})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({stats.cancelled})</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {filteredRequests.length} requests shown
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredRequests} 
      />

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ad Account</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedRequest.ad_account_name}</div>
                    <div className="text-sm text-muted-foreground">ID: {selectedRequest.ad_account_id}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount Details</Label>
                  <div className="mt-1 space-y-1">
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedRequest.amount_cents / 100)}
                    </div>
                    {selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                      <>
                        <div className="text-sm text-amber-600 dark:text-amber-400">
                          Platform Fee ({selectedRequest.plan_fee_percentage}%): +{formatCurrency(selectedRequest.fee_amount_cents / 100)}
                        </div>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400 border-t border-border pt-1">
                          Total Deducted: {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getPriorityConfig(selectedRequest.priority).color}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusConfig(selectedRequest.status).color}>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                <div className="mt-1">{selectedRequest.organization?.name || 'Unknown Organization'}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                <div className="mt-1">{selectedRequest.requested_by_user?.email || 'Unknown User'}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <div className="mt-1 text-sm">
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </div>
                </div>
                {selectedRequest.processed_at && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Processed</Label>
                    <div className="mt-1 text-sm">
                      {new Date(selectedRequest.processed_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Client Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Admin Notes</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                    {selectedRequest.admin_notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Process Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{selectedRequest.ad_account_name}</div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Top-up Amount: {formatCurrency(selectedRequest.amount_cents / 100)}
                  </div>
                  {selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                    <>
                      <div className="text-sm text-amber-600 dark:text-amber-400">
                        Platform Fee ({selectedRequest.plan_fee_percentage}%): +{formatCurrency(selectedRequest.fee_amount_cents / 100)}
                      </div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Total Deducted: {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Status: {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about processing this request..."
                  rows={3}
                />
              </div>

              {processingStatus === 'completed' && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Important</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Completing this request will deduct {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)} from the organization's wallet balance.
                    {selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                      <span className="block text-xs text-green-500 dark:text-green-400 mt-1">
                        (Includes {formatCurrency(selectedRequest.fee_amount_cents / 100)} platform fee)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRequest && handleProcessRequest(selectedRequest, processingStatus, adminNotes)}
              disabled={isProcessing}
              className={processingStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isProcessing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Mark as ${processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 