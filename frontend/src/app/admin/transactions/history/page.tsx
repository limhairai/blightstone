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
import { Search, Download, CheckCircle, X, Eye } from "lucide-react"

interface Transaction {
  id: string
  display_id?: string
  type: "topup" | "spend" | "refund" | "fee" | "bank_transfer" | "unmatched_transfer"
  amount: number
  currency: string
  status: "completed" | "pending" | "failed" | "cancelled" | "unmatched" | "matched" | "ignored"
  organizationName: string
  description: string
  createdAt: string
  paymentMethod?: string
  referenceNumber?: string
  processedAt?: string
  requestedBy?: string
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
        (transaction.display_id && transaction.display_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.referenceNumber && transaction.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.paymentMethod && transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesType && matchesStatus && matchesSearch
    })
  }, [transactions, typeFilter, statusFilter, searchTerm])

  const stats = useMemo(() => ({
    total: transactions.length,
    topup: transactions.filter(t => t.type === "topup").length,
    spend: transactions.filter(t => t.type === "spend").length,
    refund: transactions.filter(t => t.type === "refund").length,
    fee: transactions.filter(t => t.type === "fee").length,
    bank_transfer: transactions.filter(t => t.type === "bank_transfer").length,
    unmatched_transfer: transactions.filter(t => t.type === "unmatched_transfer").length,
    completed: transactions.filter(t => t.status === "completed").length,
    pending: transactions.filter(t => t.status === "pending").length,
    failed: transactions.filter(t => t.status === "failed").length,
    cancelled: transactions.filter(t => t.status === "cancelled").length,
    unmatched: transactions.filter(t => t.status === "unmatched").length,
  }), [transactions])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading transactions...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }



  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      pending: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
      failed: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      cancelled: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
      unmatched: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      matched: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
      ignored: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "display_id",
      header: "ID",
      size: 80,
      cell: ({ row }) => {
        const displayId = row.getValue<string>("display_id")
        const id = row.original.id
        return (
          <div className="font-mono text-xs font-medium">
            {displayId || (id ? `${id.substring(0, 8)}...` : 'No ID')}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 80,
      cell: ({ row }) => {
        const type = row.getValue<string>("type")
        const shortType = type === "bank_transfer" ? "Bank" : 
                         type === "unmatched_transfer" ? "Unmatched" : 
                         type.charAt(0).toUpperCase() + type.slice(1)
        return (
          <Badge variant="outline" className="text-xs">
            {shortType}
          </Badge>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      size: 90,
      cell: ({ row }) => {
        const amount = row.getValue<number>("amount")
        const currency = row.original.currency
        const type = row.original.type
        const isNegative = type === "spend" || type === "fee"
        const isPositive = type === "topup" || type === "refund" || type === "bank_transfer" || type === "unmatched_transfer"
        return (
          <div className={`font-medium text-sm ${isNegative ? "text-red-600 dark:text-red-400" : isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {isNegative ? "-" : isPositive ? "+" : ""}{currency} {amount.toLocaleString()}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 80,
      cell: ({ row }) => {
        const status = row.getValue<string>("status")
        return (
          <Badge className={`text-xs ${getStatusColor(status)}`}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      size: 120,
      cell: ({ row }) => {
        const transaction = row.original
        const paymentMethod = transaction.paymentMethod || 'Unknown'
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">{paymentMethod}</div>
            {transaction.referenceNumber && (
              <div className="text-xs text-muted-foreground font-mono truncate">
                {transaction.referenceNumber.length > 20 
                  ? `${transaction.referenceNumber.substring(0, 20)}...`
                  : transaction.referenceNumber}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "organizationName",
      header: "Organization",
      size: 140,
      cell: ({ row }) => (
        <div className="font-medium text-sm truncate">
          {row.getValue("organizationName")}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 120,
      cell: ({ row }) => {
        const description = row.getValue<string>("description")
        const shortDescription = description.length > 30 
          ? `${description.substring(0, 30)}...`
          : description
        return (
          <div className="text-xs text-muted-foreground truncate" title={description}>
            {shortDescription}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      size: 100,
      cell: ({ row }) => {
        const date = new Date(row.getValue<string>("createdAt"))
        return (
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        const transaction = row.original
        
        // Only show actions for bank transfers and unmatched transfers
        if (transaction.type !== "bank_transfer" && transaction.type !== "unmatched_transfer") {
          return null
        }
        
        const handleTransferAction = async (action: 'completed' | 'failed' | 'ignored') => {
          try {
            const endpoint = transaction.type === "bank_transfer" 
              ? `/api/admin/bank-transfers/${transaction.id}`
              : `/api/admin/unmatched-transfers/${transaction.id}`
            
            const response = await fetch(endpoint, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({ status: action })
            })
            
            if (!response.ok) {
              throw new Error(`Failed to update ${transaction.type.replace('_', ' ')}`)
            }
            
            // Refresh the transactions
            window.location.reload()
            toast.success(`${transaction.type.replace('_', ' ')} ${action}`)
          } catch (error) {
            toast.error(`Failed to update ${transaction.type.replace('_', ' ')}`)
          }
        }
        
        return (
          <div className="flex items-center gap-1">
            {(transaction.status === "pending" || transaction.status === "unmatched") && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleTransferAction('completed')}
                  className="bg-green-600 hover:bg-green-700 h-6 text-xs px-2"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleTransferAction('failed')}
                  className="h-6 text-xs px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
                {transaction.type === "unmatched_transfer" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTransferAction('ignored')}
                    className="h-6 text-xs px-2"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
              </>
            )}
            {transaction.status !== "pending" && transaction.status !== "unmatched" && (
              <div className="text-xs text-muted-foreground">
                {transaction.status === "completed" ? "✓" : 
                 transaction.status === "failed" ? "✗" : 
                 transaction.status === "cancelled" ? "⊘" : 
                 transaction.status === "ignored" ? "⊘" : 
                 transaction.status}
              </div>
            )}
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
              <SelectItem value="bank_transfer">Bank Transfer ({stats.bank_transfer})</SelectItem>
              <SelectItem value="unmatched_transfer">Unmatched Transfer ({stats.unmatched_transfer})</SelectItem>
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
              <SelectItem value="cancelled">Cancelled ({stats.cancelled})</SelectItem>
              <SelectItem value="unmatched">Unmatched ({stats.unmatched})</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
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
      
      <div className="rounded-md border overflow-x-auto">
        <DataTable 
          columns={columns} 
          data={filteredTransactions} 
        />
      </div>
    </div>
  )
} 