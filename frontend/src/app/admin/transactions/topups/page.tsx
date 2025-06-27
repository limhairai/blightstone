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
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Clock, X, Search } from "lucide-react"

interface TopupRequest {
  id: string
  organizationName: string
  businessName: string
  accountName: string
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  notes?: string
  adminNotes?: string
}

export default function TopupRequestsPage() {
  const { session } = useAuth()
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch funding requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!session?.access_token) return

      try {
        const response = await fetch('/api/funding-requests', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch funding requests')
        }
        
        const data = await response.json()
        
        // Transform funding requests to match TopupRequest interface
        const transformedRequests = (data.requests || []).map((req: any) => ({
          id: req.id,
          organizationName: req.organization?.name || 'Unknown Organization',
          businessName: req.business?.name || 'Unknown Business',
          accountName: req.account_name,
          amount: req.amount,
          currency: 'USD',
          status: req.status,
          requestedAt: req.created_at,
          notes: req.notes,
          adminNotes: req.admin_notes
        }))
        
        setRequests(transformedRequests)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funding requests')
        toast.error('Failed to load funding requests')
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [session])

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        request.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesStatus && matchesSearch
    })
  }, [requests, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading funding requests...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/funding-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          id,
          status: 'approved',
          admin_notes: 'Approved by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve request')
      }

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: 'approved' as const } : req
      ))
      
      toast.success('Funding request approved')
    } catch (err) {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const response = await fetch('/api/funding-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          id,
          status: 'rejected',
          admin_notes: 'Rejected by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject request')
      }

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: 'rejected' as const } : req
      ))
      
      toast.success('Funding request rejected')
    } catch (err) {
      toast.error('Failed to reject request')
    }
  }

  const columns: ColumnDef<TopupRequest>[] = [
    {
      accessorKey: "organizationName",
      header: "Organization",
      size: 200,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.organizationName}</div>
          <div className="text-sm text-muted-foreground">{row.original.businessName}</div>
          <div className="text-xs text-muted-foreground">Account: {row.original.accountName}</div>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      size: 120,
      cell: ({ row }) => {
        const amount = row.getValue<number>("amount")
        const currency = row.original.currency
        return (
          <div className="font-medium">
            {currency} {amount.toLocaleString()}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => {
        const status = row.getValue<string>("status")
        const statusConfig = {
          pending: { variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
          approved: { variant: "default" as const, color: "bg-green-100 text-green-800 border-green-200" },
          rejected: { variant: "destructive" as const, color: "bg-red-100 text-red-800 border-red-200" }
        }
        return (
          <Badge className={`capitalize ${statusConfig[status as keyof typeof statusConfig].color}`}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "requestedAt",
      header: "Requested",
      size: 120,
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("requestedAt"))
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      size: 180,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground truncate">
          {row.original.notes || "—"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 150,
      cell: ({ row }) => {
        const request = row.original
        if (request.status !== "pending") return null
        
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleApprove(request.id)}
              className="bg-green-600 hover:bg-green-700 h-7 text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(request.id)}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status ({stats.total})</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
              <SelectItem value="approved">Approved ({stats.approved})</SelectItem>
              <SelectItem value="rejected">Rejected ({stats.rejected})</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px]"
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
    </div>
  )
} 