"use client"

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useSWR, { mutate } from 'swr'
import { authenticatedFetcher } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

interface PageRequest {
  request_id: string
  organization_id: string
  page_name: string
  page_category: string | null
  page_description: string | null
  business_manager_id: string | null
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  admin_notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  processed_by: string | null
  organizations: {
    name: string
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'approved':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
    case 'completed':
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AdminPageRequestsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<PageRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')

  const { data: pageRequestsData, error, isLoading, mutate: mutateRequests } = useSWR(
    '/api/page-requests',
    authenticatedFetcher,
    { 
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  const pageRequests: PageRequest[] = pageRequestsData?.pageRequests || []

  const filteredRequests = useMemo(() => {
    return pageRequests.filter(request => {
      const matchesSearch = !searchQuery || 
        request.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.organizations.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [pageRequests, searchQuery, statusFilter])

  const handleProcessRequest = async (requestId: string, status: string, notes: string) => {
    setProcessing(true)
    
    try {
      const response = await fetch('/api/page-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: notes,
          processed_by: user?.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update request')
      }

      toast.success('Request updated successfully')
      mutateRequests()
      setSelectedRequest(null)
      setAdminNotes('')
      setNewStatus('')
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update request')
    } finally {
      setProcessing(false)
    }
  }

  const openRequestDialog = (request: PageRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || '')
    setNewStatus(request.status)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Page Requests</h3>
          <p className="text-muted-foreground mb-4">Failed to load page requests</p>
          <Button onClick={() => mutateRequests()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Page Requests</h1>
          <p className="text-muted-foreground">Manage client requests for custom Facebook pages</p>
        </div>
        
        <Button onClick={() => mutateRequests()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{pageRequests.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pageRequests.filter(r => r.status === 'pending').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{pageRequests.filter(r => r.status === 'approved').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{pageRequests.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading requests...
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Page Requests</h3>
                  <p className="text-muted-foreground">No page requests found matching your criteria</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.page_name}</div>
                      {request.page_description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {request.page_description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{request.organizations.name}</TableCell>
                  <TableCell>
                    {request.page_category ? (
                      <Badge variant="outline">{request.page_category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRequestDialog(request)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Page Request Details</DialogTitle>
            <DialogDescription>
              Review and process this page request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Page Name</Label>
                  <p className="text-sm">{selectedRequest.page_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Organization</Label>
                  <p className="text-sm">{selectedRequest.organizations.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedRequest.page_category || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {selectedRequest.page_description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedRequest.page_description}</p>
                </div>
              )}

              {selectedRequest.business_manager_id && (
                <div>
                  <Label className="text-sm font-medium">Business Manager ID</Label>
                  <p className="text-sm font-mono">{selectedRequest.business_manager_id}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label htmlFor="status" className="text-sm font-medium">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRequest(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleProcessRequest(selectedRequest.request_id, newStatus, adminNotes)}
                    disabled={processing || newStatus === selectedRequest.status}
                  >
                    {processing ? 'Updating...' : 'Update Request'}
                  </Button>
                </div>
              </div>

              {/* Request Timeline */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Timeline</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span>Created:</span>
                    <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Updated:</span>
                    <span>{new Date(selectedRequest.updated_at).toLocaleString()}</span>
                  </div>
                  {selectedRequest.completed_at && (
                    <div className="flex justify-between text-sm">
                      <span>Completed:</span>
                      <span>{new Date(selectedRequest.completed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}