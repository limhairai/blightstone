"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useSWR, { mutate } from 'swr'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminInstantButton } from '@/components/ui/admin-instant-button'
import { useAdminPerformance, useInstantAdminTable } from '@/lib/admin-performance'
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  AlertCircle,
  Building2,
  Globe
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

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
  const { session } = useAuth()
  const { navigateToAdmin } = useAdminPerformance()
  const adminTableHook = useInstantAdminTable()
  const [selectedRequest, setSelectedRequest] = useState<PageRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')

  const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const { data: pageRequestsData, error, isLoading, mutate: mutateRequests } = useSWR(
    '/api/admin/page-requests',
    fetcher,
    { 
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  )

  const pageRequests: PageRequest[] = pageRequestsData?.pageRequests || []

  const filterRequests = (status: string) => {
    return pageRequests.filter((request: PageRequest) => request.status === status);
  };

  const handleProcessRequest = async (requestId: string, status: string, notes: string) => {
    setProcessing(true)
    
    try {
      const response = await fetch('/api/admin/page-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: notes,
          processed_by: session?.user?.id
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderRequestsTable = (requests: PageRequest[]) => {

    if (requests.length === 0) {
      return (
        <div className="border rounded-lg p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Page Requests</h3>
          <p className="text-muted-foreground">No page requests found for this status.</p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization & Page</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Business Manager</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.request_id}>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{request.organizations.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{request.page_name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {request.page_category ? (
                    <Badge variant="outline">{request.page_category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.business_manager_id ? (
                    <div className="text-xs text-muted-foreground font-mono">
                      {request.business_manager_id}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(request.created_at)}</div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-500' :
                        request.status === 'approved' ? 'bg-blue-500' :
                        request.status === 'completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium capitalize">{request.status}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <AdminInstantButton
                    variant="ghost"
                    size="sm"
                    onClick={() => openRequestDialog(request)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </AdminInstantButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading page requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        Failed to load page requests: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({filterRequests('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filterRequests('approved').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterRequests('completed').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filterRequests('rejected').length})
            </TabsTrigger>
          </TabsList>
          
          <AdminInstantButton onClick={() => mutateRequests()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </AdminInstantButton>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {renderRequestsTable(filterRequests('pending'))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {renderRequestsTable(filterRequests('approved'))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {renderRequestsTable(filterRequests('completed'))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {renderRequestsTable(filterRequests('rejected'))}
        </TabsContent>
      </Tabs>

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