"use client"

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useMemo } from "react"
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
  amount: number
  currency: string
  status: "pending" | "approved" | "rejected"
  requestedAt: string
  notes?: string
}

export default function TopupRequestsPage() {
  const [requests] = useState<TopupRequest[]>([
    {
      id: "top-001",
      organizationName: "TechCorp Solutions",
      businessName: "TechCorp Marketing",
      amount: 5000,
      currency: "USD",
      status: "pending",
      requestedAt: "2024-01-15T10:30:00Z",
      notes: "Monthly marketing budget"
    },
    {
      id: "top-002",
      organizationName: "Digital Pro Agency", 
      businessName: "DPA Campaigns",
      amount: 2500,
      currency: "USD",
      status: "pending",
      requestedAt: "2024-01-14T14:20:00Z"
    },
    {
      id: "top-003",
      organizationName: "E-commerce Plus",
      businessName: "ECP Store",
      amount: 3000,
      currency: "USD",
      status: "approved",
      requestedAt: "2024-01-13T09:15:00Z",
      notes: "Q1 advertising budget"
    },
    {
      id: "top-004",
      organizationName: "StartupCo",
      businessName: "StartupCo Main",
      amount: 1000,
      currency: "USD",
      status: "rejected",
      requestedAt: "2024-01-12T16:45:00Z",
      notes: "Insufficient documentation"
    }
  ])

  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        request.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleApprove = (id: string) => {
    console.log("Approving request:", id)
  }

  const handleReject = (id: string) => {
    console.log("Rejecting request:", id)
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