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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog"

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
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<TopupRequestStatus>('processing')

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
      const matchesType = typeFilter === "all" || (request.request_type || 'topup') === typeFilter
      const matchesSearch = searchTerm === "" || 
        request.ad_account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.display_id && request.display_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (request.id && request.id.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesStatus && matchesType && matchesSearch
    })
  }, [requests, statusFilter, typeFilter, searchTerm])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    processing: requests.filter(r => r.status === "processing").length,
    completed: requests.filter(r => r.status === "completed").length,
    failed: requests.filter(r => r.status === "failed").length,
    cancelled: requests.filter(r => r.status === "cancelled").length,
    topups: requests.filter(r => (r.request_type || 'topup') === 'topup').length,
    balance_resets: requests.filter(r => r.request_type === 'balance_reset').length,
  }), [requests])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading top-up requests...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const handleProcessRequest = async (request: TopupRequest, status: TopupRequestStatus) => {
    const statusMessages = {
      pending: 'Request marked as pending',
      processing: 'Request marked as processing',
      completed: 'Request completed successfully',
      failed: 'Request marked as failed',
      cancelled: 'Request cancelled'
    };

    setIsProcessing(true);
    setShowProcessDialog(false);
    setSelectedRequest(null);

    try {
      const response = await fetch(`/api/topup-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request');
      }

      // Update with server response
      const updatedRequest = await response.json();
      setRequests(prev => prev.map(req => 
        req.id === request.id ? updatedRequest : req
      ));

      // Show success after successful server update
      toast.success(statusMessages[status] || 'Request updated');
      
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setIsProcessing(false);
    }
  };

  const openProcessDialog = (request: TopupRequest, status: TopupRequestStatus) => {
    setSelectedRequest(request)
    setProcessingStatus(status)
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



  const columns: ColumnDef<TopupRequest>[] = [
    {
      accessorKey: "display_id",
      header: "Request ID",
      size: 80,
      cell: ({ row }) => {
        const displayId = row.getValue<string>("display_id")
        const id = row.original.id
        return (
          <div className="font-mono text-xs">
            <div className="font-medium">{displayId || `${id?.substring(0, 8)}...`}</div>
            <div className="text-muted-foreground">{id?.substring(8, 16)}...</div>
          </div>
        )
      },
    },
    {
      accessorKey: "ad_account_name",
      header: "Account Details",
      size: 160,
      cell: ({ row }) => {
        const request = row.original
        const accountName = request.ad_account_name || 'No Account Name'
        const accountId = request.ad_account_id || 'No Account ID'
        return (
          <div className="text-xs">
            <div className="font-medium truncate max-w-[140px]" title={accountName}>
              {accountName}
            </div>
            <div className="text-muted-foreground font-mono truncate max-w-[140px]" title={accountId}>
              {accountId}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "request_type",
      header: "Type",
      size: 70,
      cell: ({ row }) => {
        const request = row.original
        const requestType = request.request_type || 'topup'
        const isBalanceReset = requestType === 'balance_reset'
        
        return (
          <Badge 
            className={`text-xs px-1 py-0.5 ${
              isBalanceReset 
                ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' 
                : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
            }`}
          >
            {isBalanceReset ? 'Reset' : 'Top-up'}
          </Badge>
        )
      },
    },
    {
      accessorKey: "business_manager",
      header: "Business Manager",
      size: 140,
      cell: ({ row }) => {
        const request = row.original
        const bmName = request.metadata?.business_manager_name || 'Not Available'
        const bmId = request.metadata?.business_manager_id || 'Not Available'
        return (
          <div className="text-xs">
            <div className="font-medium truncate max-w-[120px]" title={bmName}>
              {bmName}
            </div>
            <div className="text-muted-foreground font-mono truncate max-w-[120px]" title={bmId}>
              {bmId}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "bm_id",
      header: "BM ID",
      size: 100,
      cell: ({ row }) => {
        const request = row.original
        const bmId = request.metadata?.business_manager_id || 'Not Available'
        return (
          <div className="text-xs text-muted-foreground font-mono truncate max-w-[80px]" title={bmId}>
            {bmId}
          </div>
        )
      },
    },
    {
      accessorKey: "amount_cents",
      header: "Amount",
      size: 80,
      cell: ({ row }) => {
        const request = row.original
        const amountCents = request.amount_cents
        const isBalanceReset = request.request_type === 'balance_reset'
        
        return (
          <div className={`font-medium text-xs ${
            isBalanceReset 
              ? 'text-purple-600 dark:text-purple-400' 
              : 'text-green-600 dark:text-green-400'
          }`}>
            {formatCurrency(amountCents / 100)}
          </div>
        )
      },
    },
    {
      accessorKey: "fee_amount_cents",
      header: "Fees",
      size: 60,
      cell: ({ row }) => {
        const request = row.original
        const feeAmountCents = request.fee_amount_cents || 0
        const feePercentage = request.plan_fee_percentage || 0
        const isBalanceReset = request.request_type === 'balance_reset'
        
        return (
          <div className="text-xs">
            {isBalanceReset ? (
              <div className="text-muted-foreground">N/A</div>
            ) : feeAmountCents > 0 ? (
              <div className="text-muted-foreground">
                {formatCurrency(feeAmountCents / 100)}
                <div className="text-xs">({feePercentage}%)</div>
              </div>
            ) : (
              <div className="text-muted-foreground">No fee</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "total_deducted_cents",
      header: "Total Deducted",
      size: 90,
      cell: ({ row }) => {
        const request = row.original
        const totalDeductedCents = request.total_deducted_cents || request.amount_cents
        const isBalanceReset = request.request_type === 'balance_reset'
        
        return (
          <div className="font-medium text-xs text-foreground">
            {isBalanceReset ? (
              <div className="text-muted-foreground">N/A</div>
            ) : (
              formatCurrency(totalDeductedCents / 100)
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 90,
      cell: ({ row }) => {
        const status = row.getValue<TopupRequestStatus>("status")
        const config = getStatusConfig(status)
        const Icon = config.icon
        return (
          <Badge className={`text-xs px-1 py-0.5 ${config.color} flex items-center gap-1`}>
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
        const user = row.original.requested_by
        const orgName = (row.original as any).organization?.name || 'Organization'
        
        return (
          <div className="text-xs">
            <div className="text-muted-foreground">
              {formatDistanceToNow(date, { addSuffix: true })}
            </div>
            <div className="text-muted-foreground truncate max-w-[100px]" title={`by ${user || 'Unknown User'}`}>
              by {user || 'Unknown User'}
            </div>
            <div className="text-muted-foreground truncate max-w-[100px]" title={orgName}>
              {orgName}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 140,
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
              className="h-6 text-xs px-2"
            >
              <Eye className="h-3 w-3" />
            </Button>
            
            {request.status === "pending" && (
              <>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'processing')}
                  className="bg-blue-600 hover:bg-blue-700 h-6 text-xs px-2"
                >
                  <Clock className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'completed')}
                  className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </>
            )}
            
            {request.status === "processing" && (
              <>
                <Button
                  size="sm"
                  onClick={() => openProcessDialog(request, 'completed')}
                  className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openProcessDialog(request, 'failed')}
                  className="h-6 text-xs px-2"
                >
                  <X className="h-3 w-3" />
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

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({stats.total})</SelectItem>
              <SelectItem value="topup">Top-ups ({stats.topups})</SelectItem>
              <SelectItem value="balance_reset">Balance Resets ({stats.balance_resets})</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts, organizations..."
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
      
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground w-20">Request ID</TableHead>
              <TableHead className="text-muted-foreground w-40">Account Details</TableHead>
              <TableHead className="text-muted-foreground w-20">Type</TableHead>
              <TableHead className="text-muted-foreground w-36">Business Manager</TableHead>
              <TableHead className="text-muted-foreground w-20">Amount</TableHead>
              <TableHead className="text-muted-foreground w-16">Fees</TableHead>
              <TableHead className="text-muted-foreground w-24">Total Deducted</TableHead>
              <TableHead className="text-muted-foreground w-24">Status</TableHead>
              <TableHead className="text-muted-foreground w-32">Requested</TableHead>
              <TableHead className="text-muted-foreground w-36">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No top-up requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const config = getStatusConfig(request.status);
                const Icon = config.icon;
                const isBalanceReset = request.request_type === 'balance_reset';
                
                return (
                  <TableRow key={request.id} className="border-border hover:bg-muted/50">
                    <TableCell className="w-20">
                      <div className="font-mono text-xs">
                        <div className="font-medium">{request.display_id || `${request.id?.substring(0, 8)}...`}</div>
                        <div className="text-muted-foreground">{request.id?.substring(8, 16)}...</div>
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="text-xs">
                        <div className="font-medium truncate max-w-[140px]" title={request.ad_account_name || 'No Account Name'}>
                          {request.ad_account_name || 'No Account Name'}
                        </div>
                        <div className="text-muted-foreground font-mono truncate max-w-[140px]" title={request.ad_account_id || 'No Account ID'}>
                          {request.ad_account_id || 'No Account ID'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-20">
                      <Badge 
                        className={`text-xs px-1 py-0.5 ${
                          isBalanceReset 
                            ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' 
                            : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        }`}
                      >
                        {isBalanceReset ? 'Reset' : 'Top-up'}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="text-xs">
                        <div className="font-medium truncate max-w-[120px]" title={request.metadata?.business_manager_name || 'Not Available'}>
                          {request.metadata?.business_manager_name || 'Not Available'}
                        </div>
                        <div className="text-muted-foreground font-mono truncate max-w-[120px]" title={request.metadata?.business_manager_id || 'Not Available'}>
                          {request.metadata?.business_manager_id || 'Not Available'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-20">
                      <div className={`font-medium text-xs ${
                        isBalanceReset 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatCurrency(request.amount_cents / 100)}
                      </div>
                    </TableCell>
                    <TableCell className="w-16">
                      <div className="text-xs">
                        {isBalanceReset ? (
                          <div className="text-muted-foreground">N/A</div>
                        ) : request.fee_amount_cents && request.fee_amount_cents > 0 ? (
                          <div className="text-muted-foreground">
                            {formatCurrency(request.fee_amount_cents / 100)}
                            <div className="text-xs">({request.plan_fee_percentage}%)</div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No fee</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <div className="font-medium text-xs text-foreground">
                        {isBalanceReset ? (
                          <div className="text-muted-foreground">N/A</div>
                        ) : (
                          formatCurrency((request.total_deducted_cents || request.amount_cents) / 100)
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-24">
                      <Badge className={`text-xs px-1 py-0.5 ${config.color} flex items-center gap-1`}>
                        <Icon className="h-3 w-3" />
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="text-xs">
                        <div className="text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-muted-foreground truncate max-w-[100px]" title={`by ${request.requested_by || 'Unknown User'}`}>
                          by {request.requested_by || 'Unknown User'}
                        </div>
                        <div className="text-muted-foreground truncate max-w-[100px]" title={(request as any).organization?.name || 'Organization'}>
                          {(request as any).organization?.name || 'Organization'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-36">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailsDialog(true)
                          }}
                          className="h-6 text-xs px-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openProcessDialog(request, 'processing')}
                              className="bg-blue-600 hover:bg-blue-700 h-6 text-xs px-2"
                            >
                              <Clock className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openProcessDialog(request, 'completed')}
                              className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        
                        {request.status === "processing" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openProcessDialog(request, 'completed')}
                              className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openProcessDialog(request, 'failed')}
                              className="h-6 text-xs px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Request Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Ad Account Info */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="font-medium text-foreground mb-1">{selectedRequest.ad_account_name}</div>
                <div className="text-sm text-muted-foreground font-mono">ID: {selectedRequest.ad_account_id}</div>
              </div>

              {/* Amount Details */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  {selectedRequest.request_type === 'balance_reset' ? 'Balance Reset Details' : 'Amount Details'}
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {selectedRequest.request_type === 'balance_reset' ? 'Reset Amount' : 'Top-up Amount'}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(selectedRequest.amount_cents / 100)}
                    </span>
                  </div>
                  
                  {selectedRequest.request_type !== 'balance_reset' && selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Platform Fee ({selectedRequest.plan_fee_percentage}%)
                        </span>
                        <span className="text-sm text-muted-foreground">
                          +{formatCurrency(selectedRequest.fee_amount_cents / 100)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-foreground">Total Deducted</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedRequest.request_type === 'balance_reset' && (
                    <div className="text-xs text-muted-foreground">No fees apply for balance resets</div>
                  )}
                </div>
              </div>

              {/* Status and Organization */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Status</div>
                  <Badge className={`text-xs px-2 py-1 ${getStatusConfig(selectedRequest.status).color}`}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Organization</div>
                  <div className="text-sm text-foreground">{(selectedRequest as any).organization?.name || 'Organization'}</div>
                </div>
              </div>

              {/* Transfer Destination for Balance Resets */}
              {selectedRequest.request_type === 'balance_reset' && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Transfer Destination</div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedRequest.transfer_destination_type === 'wallet' ? 'Wallet' : 'Ad Account'}
                      </Badge>
                      {selectedRequest.metadata?.destination_account_name && (
                        <span className="text-sm text-muted-foreground">
                          &rarr; {selectedRequest.metadata.destination_account_name}
                        </span>
                      )}
                    </div>
                    {selectedRequest.transfer_destination_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {selectedRequest.transfer_destination_id}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Request Info */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Request Information</div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Requested By</span>
                    <span className="text-sm text-foreground font-mono">
                      {selectedRequest.requested_by || 'Unknown User'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm text-foreground">
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedRequest.processed_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Processed</span>
                      <span className="text-sm text-foreground">
                        {new Date(selectedRequest.processed_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Request Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Process Request
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="font-medium text-foreground mb-2">{selectedRequest.ad_account_name}</div>
                <div className="space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    Top-up Amount: {formatCurrency(selectedRequest.amount_cents / 100)}
                  </div>
                  {selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                    <>
                      <div className="text-muted-foreground">
                        Platform Fee ({selectedRequest.plan_fee_percentage}%): +{formatCurrency(selectedRequest.fee_amount_cents / 100)}
                      </div>
                      <div className="font-medium text-foreground pt-1 border-t border-border">
                        Total Deducted: {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Status: </span>
                <span className="font-medium text-foreground">
                  {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
                </span>
              </div>

              {processingStatus === 'completed' && (
                <div className="p-3 bg-muted/30 border border-border rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-foreground mb-1">Important</div>
                      <p className="text-sm text-muted-foreground">
                        Completing this request will deduct {formatCurrency((selectedRequest.total_deducted_cents || selectedRequest.amount_cents) / 100)} from the organization&apos;s wallet balance.
                        {selectedRequest.fee_amount_cents && selectedRequest.fee_amount_cents > 0 && (
                          <span className="block text-xs mt-1">
                            (Includes {formatCurrency(selectedRequest.fee_amount_cents / 100)} platform fee)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProcessDialog(false)}
              disabled={isProcessing}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRequest && handleProcessRequest(selectedRequest, processingStatus)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-white hover:opacity-90 border-0"
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