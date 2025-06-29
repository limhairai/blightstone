"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../../contexts/AuthContext"
import { useOrganizationStore } from "../../../lib/stores/organization-store"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { DataTable } from "../../../components/ui/data-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Input } from "../../../components/ui/input"
import { RequestAccountFundingDialog } from "../../../components/accounts/request-account-funding-dialog"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { Search, Plus, Clock, CheckCircle, X, AlertCircle, DollarSign, Eye } from "lucide-react"
import { formatCurrency } from "../../../utils/format"
import { toast } from "sonner"
import type { TopupRequest, TopupRequestStatus } from "../../../types/topup-request"
import type { AdAccount } from "../../../types/ad-account"

export default function ClientTopupRequestsPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AdAccount | null>(null)

  useEffect(() => {
    if (currentOrganizationId) {
      fetchRequests()
      fetchAdAccounts()
    }
  }, [currentOrganizationId])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/topup-requests?organization_id=${currentOrganizationId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch top-up requests')
      }
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (err) {
      toast.error('Failed to load top-up requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdAccounts = async () => {
    try {
      const response = await fetch(`/api/ad-accounts?organization_id=${currentOrganizationId}`)
      
      if (response.ok) {
        const data = await response.json()
        setAdAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error('Failed to fetch ad accounts:', err)
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    const matchesSearch = searchTerm === "" || 
      request.ad_account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.notes && request.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    processing: requests.filter(r => r.status === "processing").length,
    completed: requests.filter(r => r.status === "completed").length,
    failed: requests.filter(r => r.status === "failed").length,
  }

  const getStatusConfig = (status: TopupRequestStatus) => {
    switch (status) {
      case 'pending':
        return { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock }
      case 'processing':
        return { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock }
      case 'completed':
        return { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle }
      case 'failed':
        return { color: "bg-red-100 text-red-800 border-red-200", icon: X }
      case 'cancelled':
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: X }
      default:
        return { color: "bg-gray-100 text-gray-800 border-gray-200", icon: Clock }
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: "bg-red-500/20 text-red-500 border-red-500" }
      case 'high':
        return { color: "bg-orange-500/20 text-orange-500 border-orange-500" }
      case 'normal':
        return { color: "bg-blue-500/20 text-blue-500 border-blue-500" }
      case 'low':
        return { color: "bg-gray-500/20 text-gray-500 border-gray-500" }
      default:
        return { color: "bg-blue-500/20 text-blue-500 border-blue-500" }
    }
  }

  const handleRequestTopup = (account: AdAccount) => {
    setSelectedAccount(account)
    setShowRequestDialog(true)
  }

  const handleRequestSuccess = () => {
    fetchRequests() // Refresh the requests list
    setSelectedAccount(null)
  }

  const columns: ColumnDef<TopupRequest>[] = [
    {
      accessorKey: "ad_account_name",
      header: "Ad Account",
      size: 200,
      cell: ({ row }) => {
        const request = row.original
        return (
          <div>
            <div className="font-medium">{request.ad_account_name}</div>
            <div className="text-xs text-muted-foreground">ID: {request.ad_account_id}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "amount_cents",
      header: "Amount",
      size: 120,
      cell: ({ row }) => {
        const amountCents = row.getValue<number>("amount_cents")
        return (
          <div className="font-medium text-green-600">
            {formatCurrency(amountCents / 100)}
          </div>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      size: 100,
      cell: ({ row }) => {
        const priority = row.original.priority
        const config = getPriorityConfig(priority)
        return (
          <Badge variant="outline" className={`capitalize ${config.color}`}>
            {priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      cell: ({ row }) => {
        const status = row.getValue<TopupRequestStatus>("status")
        const config = getStatusConfig(status)
        const Icon = config.icon
        return (
          <Badge className={`capitalize ${config.color} flex items-center gap-1`}>
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
      size: 200,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
          {row.original.notes || "—"}
        </div>
      ),
    },
  ]

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Top-up Requests</h1>
          <p className="text-muted-foreground">Request funds to be allocated to your ad accounts</p>
        </div>
        
        <Button
          onClick={() => setShowRequestDialog(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Ad Accounts Quick Actions */}
      {adAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quick Top-up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adAccounts.slice(0, 6).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Balance: {formatCurrency((account.balance_cents || 0) / 100)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestTopup(account)}
                    className="ml-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Top-up
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
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
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredRequests.length} requests shown
        </div>
      </div>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={filteredRequests}
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredRequests.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {statusFilter !== "all" 
                ? `No ${statusFilter} requests found. Try adjusting your filters.`
                : "You haven't made any top-up requests yet. Create your first request to get started."
              }
            </p>
            <Button
              onClick={() => setShowRequestDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request Dialog */}
      <RequestAccountFundingDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        accountId={selectedAccount?.ad_account_id || selectedAccount?.account_id}
        accountName={selectedAccount?.name}
        onSuccess={handleRequestSuccess}
      />
    </div>
  )
} 