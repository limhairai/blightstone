"use client"

import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import useSWR, { mutate } from 'swr'
import { authenticatedFetcher } from '@/lib/swr-config'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Target, 
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
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<PixelRequest | null>(null)
  const [processing, setProcessing] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')

  // For now, return empty data since pixel requests system isn't implemented yet
  const pixelRequests: PixelRequest[] = []
  const isLoading = false
  const error = null

  const filteredRequests = useMemo(() => {
    return pixelRequests.filter(request => {
      const matchesSearch = !searchQuery || 
        request.pixel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.organizations.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [pixelRequests, searchQuery, statusFilter])

  const handleProcessRequest = async (requestId: string, status: string, notes: string) => {
    // TODO: Implement pixel request processing
    toast.info('Pixel request processing not yet implemented')
  }

  const openRequestDialog = (request: PixelRequest) => {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || '')
    setNewStatus(request.status)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Pixel Requests</h3>
          <p className="text-muted-foreground mb-4">Failed to load pixel requests</p>
          <Button onClick={() => {}}>
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
          <h1 className="text-2xl font-bold">Pixel Requests</h1>
          <p className="text-muted-foreground">Manage client requests for custom Facebook pixels</p>
        </div>
        
        <Button onClick={() => {}} variant="outline">
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
              <p className="text-2xl font-bold">{pixelRequests.length}</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pixelRequests.filter(r => r.status === 'pending').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{pixelRequests.filter(r => r.status === 'approved').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{pixelRequests.filter(r => r.status === 'completed').length}</p>
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
              <TableHead>Pixel Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Business Manager</TableHead>
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
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pixel Requests</h3>
                  <p className="text-muted-foreground">
                    {pixelRequests.length === 0 
                      ? "Pixel request system is not yet implemented" 
                      : "No pixel requests found matching your criteria"
                    }
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.pixel_name}</div>
                      {request.pixel_description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {request.pixel_description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{request.organizations.name}</TableCell>
                  <TableCell>
                    {request.business_manager_id ? (
                      <span className="font-mono text-sm">{request.business_manager_id}</span>
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
    </div>
  )
}