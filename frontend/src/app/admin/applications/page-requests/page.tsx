"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useSWR, { mutate } from 'swr'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed'
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
      return <Badge variant="secondary" className="bg-muted text-muted-foreground border-border"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case 'processing':
      return <Badge variant="secondary" className="bg-secondary text-foreground border-border"><RefreshCw className="w-3 h-3 mr-1" />Processing</Badge>
    case 'approved':
      return <Badge variant="secondary" className="bg-secondary text-foreground border-border"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
    case 'rejected':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
    case 'completed':
      return <Badge variant="secondary" className="bg-secondary text-foreground border-border"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function AdminPageRequestsPage() {
  const { session } = useAuth()
  const { navigateToAdmin } = useAdminPerformance()
  const adminTableHook = useInstantAdminTable()
  const [processing, setProcessing] = useState(false)

  const fetcher = async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch page requests')
    }
    return response.json()
  }

  const { data: pageRequestsData, error, isLoading, mutate: mutateRequests } = useSWR(
    session?.access_token ? '/api/admin/page-requests' : null,
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: notes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update page request')
      }

      const result = await response.json()
      toast.success(result.message || 'Page request updated successfully')
      
      // Refresh the data
      mutateRequests()
      
    } catch (error) {
      console.error('Error processing page request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update page request')
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

  const renderRequestsTable = (requests: PageRequest[]) => {
    if (requests.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {requests === filterRequests('pending') ? 'pending' : 
               requests === filterRequests('processing') ? 'processing' : 
               requests === filterRequests('completed') ? 'completed' : 'rejected'} page requests found.
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">Organization</TableHead>
              <TableHead className="text-muted-foreground">Request Type</TableHead>
              <TableHead className="text-muted-foreground">Details</TableHead>
              <TableHead className="text-muted-foreground">Applied</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.request_id} className="admin-table-row border-border hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{request.organizations.name}</div>
                      <div className="text-sm text-muted-foreground truncate">N/A</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="secondary">
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Page Request
                      </div>
                    </Badge>
                    {request.business_manager_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        BM: {request.business_manager_id}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 max-w-xs">
                    <div className="flex items-center gap-1 text-xs text-foreground">
                      <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{request.page_name}</span>
                    </div>
                    {request.page_category && (
                      <div className="text-xs text-muted-foreground">
                        Category: {request.page_category}
                      </div>
                    )}
                    {request.page_description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {request.page_description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(request.created_at)}</div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${
                        request.status === 'pending' ? 'bg-muted' :
                        request.status === 'processing' ? 'bg-secondary' :
                        request.status === 'completed' ? 'bg-secondary' :
                        'bg-muted'
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
                          onClick={() => handleProcessRequest(request.request_id, 'rejected', '')}
                        >
                          Reject
                        </AdminInstantButton>
                        <AdminInstantButton
                          size="sm"
                          onClick={() => handleProcessRequest(request.request_id, 'processing', '')}
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
                        onClick={() => handleProcessRequest(request.request_id, 'completed', '')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground border-0"
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
        Loading page requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
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
          
          <AdminInstantButton onClick={() => mutateRequests()} variant="outline">
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