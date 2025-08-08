"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useSWR, { mutate } from 'swr'
import { authenticatedFetcher } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminInstantButton } from '@/components/ui/admin-instant-button'
import { useAdminPerformance, useInstantAdminTable } from '@/lib/admin-performance'
import { 
  Target, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

interface PixelRequest {
  request_id: string
  organization_id: string
  pixel_name: string
  pixel_description: string | null
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

export default function AdminPixelRequestsPage() {
  const { session } = useAuth()
  const { navigateToAdmin } = useAdminPerformance()
  const adminTableHook = useInstantAdminTable()
  const [selectedRequest, setSelectedRequest] = useState<PixelRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')

  // For now, return empty data since pixel requests system isn't implemented yet
  const pixelRequests: PixelRequest[] = []
  const isLoading = false
  const error = null

  const filterRequests = (status: string) => {
    return pixelRequests.filter((request: PixelRequest) => request.status === status);
  };

  const handleProcessRequest = async (requestId: string, status: string, notes: string) => {
    // TODO: Implement pixel request processing
    toast.info('Pixel request processing not yet implemented')
  }

  const openRequestDialog = (request: PixelRequest) => {
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

  const renderRequestsTable = (requests: PixelRequest[]) => {

    if (requests.length === 0) {
      return (
        <div className="border rounded-lg p-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pixel Requests</h3>
          <p className="text-muted-foreground">
            {pixelRequests.length === 0 
              ? "Pixel request system is not yet implemented" 
              : "No pixel requests found for this status."
            }
          </p>
        </div>
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization & Pixel</TableHead>
              <TableHead>Business Manager</TableHead>
              <TableHead>Description</TableHead>
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
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{request.organizations.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{request.pixel_name}</div>
                    </div>
                  </div>
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
                  {request.pixel_description ? (
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {request.pixel_description}
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
        Loading pixel requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        Failed to load pixel requests
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
          
          <AdminInstantButton onClick={() => {}} variant="outline">
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
    </div>
  )
}