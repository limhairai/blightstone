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
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from "@/lib/utils"

interface PixelRequest {
  application_id: string
  organization_id: string
  pixel_name: string
  pixel_id: string
  target_bm_dolphin_id: string | null
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  admin_notes: string | null
  client_notes: string | null
  created_at: string
  updated_at: string
  organizations: {
    name: string
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200"><RefreshCw className="w-3 h-3 mr-1" />Processing</Badge>
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
  const [processing, setProcessing] = useState(false)

  // Fetch pixel requests from applications table
  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch pixel requests')
    }
    return response.json()
  }

  const { data: pixelRequestsData, error, isLoading, mutate: refreshData } = useSWR(
    session?.access_token ? '/api/admin/pixel-requests' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  )

  const pixelRequests: PixelRequest[] = pixelRequestsData?.pixelRequests || []

  const filterRequests = (status: string) => {
    return pixelRequests.filter((request: PixelRequest) => request.status === status);
  };

  const handleProcessRequest = async (requestId: string, status: string, notes: string) => {
    setProcessing(true)
    
    try {
      const response = await fetch('/api/admin/pixel-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          application_id: requestId,
          status,
          admin_notes: notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update pixel request')
      }

      const result = await response.json()
      toast.success(result.message || 'Pixel request updated successfully')
      
      // Refresh the data
      refreshData()
      
      // Close the dialog
      setSelectedRequest(null)
      
    } catch (error) {
      console.error('Error processing pixel request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update pixel request')
    } finally {
      setProcessing(false)
    }
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
              <TableRow key={request.application_id}>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                      <Target className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{request.organizations.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{request.pixel_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">ID: {request.pixel_id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {request.target_bm_dolphin_id ? (
                    <div className="text-xs text-muted-foreground font-mono">
                      {request.target_bm_dolphin_id}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {request.client_notes ? (
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {request.client_notes}
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
                        request.status === 'processing' ? 'bg-blue-500' :
                        request.status === 'completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-xs font-medium capitalize">{request.status}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <AdminInstantButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessRequest(request.application_id, 'rejected', '')}
                        >
                          Reject
                        </AdminInstantButton>
                        <AdminInstantButton
                          size="sm"
                          onClick={() => handleProcessRequest(request.application_id, 'processing', '')}
                          style={{
                            background: 'linear-gradient(90deg, #b4a0ff 0%, #ffb4a0 100%)',
                            color: 'black',
                            border: 'none'
                          }}
                          className="hover:opacity-90"
                        >
                          Approve
                        </AdminInstantButton>
                      </>
                    )}
                    {request.status === 'processing' && (
                      <AdminInstantButton
                        size="sm"
                        onClick={() => handleProcessRequest(request.application_id, 'completed', '')}
                        className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0"
                      >
                        Mark as Completed
                      </AdminInstantButton>
                    )}
                  </div>
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
            <TabsTrigger value="processing">
              Processing ({filterRequests('processing').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterRequests('completed').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filterRequests('rejected').length})
            </TabsTrigger>
          </TabsList>
          
          <AdminInstantButton onClick={() => refreshData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </AdminInstantButton>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {renderRequestsTable(filterRequests('pending'))}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {renderRequestsTable(filterRequests('processing'))}
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