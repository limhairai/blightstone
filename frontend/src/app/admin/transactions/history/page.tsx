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
import { Search, Download } from "lucide-react"

interface Transaction {
  id: string
  display_id?: string
  type: "topup" | "spend" | "refund" | "fee"
  amount: number
  currency: string
  status: "completed" | "pending" | "failed"
  organizationName: string
  description: string
  createdAt: string
}

export default function TransactionHistoryPage() {
  const { session } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch transactions history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!session?.access_token) return

      try {
        const response = await fetch('/api/admin/transactions', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }
        
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
        toast.error('Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [session])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === "all" || transaction.type === typeFilter
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter
      const matchesSearch = searchTerm === "" || 
        transaction.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.display_id && transaction.display_id.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesType && matchesStatus && matchesSearch
    })
  }, [transactions, typeFilter, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: transactions.length,
    topup: transactions.filter(t => t.type === "topup").length,
    spend: transactions.filter(t => t.type === "spend").length,
    refund: transactions.filter(t => t.type === "refund").length,
    fee: transactions.filter(t => t.type === "fee").length,
    completed: transactions.filter(t => t.status === "completed").length,
    pending: transactions.filter(t => t.status === "pending").length,
    failed: transactions.filter(t => t.status === "failed").length,
  }), [transactions])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading transactions...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const getTypeColor = (type: string) => {
    const colors = {
      topup: "bg-[#34D197]/10 text-[#34D197] border-[#34D197]/20",
      spend: "bg-[#F56565]/10 text-[#F56565] border-[#F56565]/20", 
      refund: "bg-blue-100 text-blue-800 border-blue-200",
      fee: "bg-purple-100 text-purple-800 border-purple-200"
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-[#34D197]/10 text-[#34D197] border-[#34D197]/20",
      pending: "bg-[#FFC857]/10 text-[#FFC857] border-[#FFC857]/20",
      failed: "bg-[#F56565]/10 text-[#F56565] border-[#F56565]/20"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "display_id",
      header: "Transaction ID",
      size: 120,
      cell: ({ row }) => {
        const displayId = row.getValue<string>("display_id")
        const id = row.original.id
        return (
          <div className="space-y-1">
            {displayId ? (
              <>
                <div className="font-mono text-sm font-medium">{displayId}</div>
                {id && (
                  <div className="font-mono text-xs text-muted-foreground">
                    {id.substring(0, 8)}...
                  </div>
                )}
              </>
            ) : (
              <div className="font-mono text-xs text-muted-foreground">
                {id ? `${id.substring(0, 8)}...` : 'No ID'}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 100,
      cell: ({ row }) => {
        const type = row.getValue<string>("type")
        return (
          <Badge className={`capitalize ${getTypeColor(type)}`}>
            {type}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      size: 120,
      cell: ({ row }) => {
        const amount = row.getValue<number>("amount")
        const currency = row.original.currency
        const type = row.original.type
        const isNegative = type === "spend" || type === "fee"
        return (
          <div className={`font-medium ${isNegative ? "text-[#F56565]" : "text-[#34D197]"}`}>
            {isNegative ? "-" : "+"}{currency} {amount.toLocaleString()}
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
        return (
          <Badge className={`capitalize ${getStatusColor(status)}`}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      size: 180,
      cell: ({ row }) => (
        <div className="font-medium truncate">
          {row.getValue("organizationName")}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 150,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground truncate">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      size: 120,
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("createdAt"))
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({stats.total})</SelectItem>
              <SelectItem value="topup">Top-up ({stats.topup})</SelectItem>
              <SelectItem value="spend">Spend ({stats.spend})</SelectItem>
              <SelectItem value="refund">Refund ({stats.refund})</SelectItem>
              <SelectItem value="fee">Fee ({stats.fee})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
              <SelectItem value="failed">Failed ({stats.failed})</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, organization, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {filteredTransactions.length} transactions shown
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <DataTable 
        columns={columns} 
        data={filteredTransactions} 
      />
    </div>
  )
} 