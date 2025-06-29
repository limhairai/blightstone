"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, DollarSign, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { formatCurrency } from '@/lib/config/financial'
import { toast } from "sonner"

interface FundingRequest {
  id: string
  account_id: string
  account_name: string
  requested_amount: number
  status: 'pending' | 'completed'
  submitted_at: string
  user_email: string
  user_name: string
  organization_id: string
  organization_name: string
  processed_at?: string
}

export default function FundingRequestsPage() {
  const [requests, setRequests] = useState<FundingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<FundingRequest | null>(null)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/funding-requests')
      if (!response.ok) throw new Error('Failed to fetch requests')
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching funding requests:', error)
      toast.error('Failed to load funding requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/funding-requests/${selectedRequest.id}/process`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to process request')

      toast.success('Funding request marked as processed')
      setProcessDialogOpen(false)
      setSelectedRequest(null)
      fetchRequests() // Refresh the list
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error('Failed to process request')
    } finally {
      setIsProcessing(false)
    }
  }

  const openProcessDialog = (request: FundingRequest) => {
    setSelectedRequest(request)
    setProcessDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Filter requests based on search and status
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Stats for the header
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    completed: requests.filter(r => r.status === 'completed').length,
    totalPendingAmount: requests
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
            Process client requests for ad account top-ups
          </p>
        </div>
        
        <Button onClick={fetchRequests} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPendingAmount)}</div>
            <div className="text-sm text-gray-600">Pending Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
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
        
        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Ad Account</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading requests...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No funding requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono text-sm">
                      {request.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user_name}</div>
                        <div className="text-sm text-muted-foreground">{request.organization_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.account_name}</div>
                      <div className="text-sm text-muted-foreground font-mono">{request.account_id}</div>
                    </TableCell>
                    <TableCell className="font-mono font-medium text-green-600">
                      {formatCurrency(request.requested_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(request.submitted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => openProcessDialog(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Processed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Process Request Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mark Funding Request as Processed</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Client</Label>
                    <p>{selectedRequest.user_name}</p>
                    <p className="text-muted-foreground">{selectedRequest.organization_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Amount</Label>
                    <p className="font-medium text-green-600 text-lg">
                      {formatCurrency(selectedRequest.requested_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="font-medium">Ad Account</Label>
                    <p>{selectedRequest.account_name}</p>
                    <p className="text-muted-foreground font-mono text-xs">{selectedRequest.account_id}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Submitted</Label>
                    <p>{new Date(selectedRequest.submitted_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Next Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Go to your provider and process the top-up for this ad account</li>
                      <li>Provider will update the spend limit via Dolphin API</li>
                      <li>Client will see the updated balance in their dashboard</li>
                      <li>Mark this request as processed once completed</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProcessDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessRequest}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Processed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 