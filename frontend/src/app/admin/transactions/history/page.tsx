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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"

import { formatDistanceToNow } from "date-fns"
import { Search, Download, CheckCircle, X, Eye, Clock, AlertTriangle } from "lucide-react"

// Add fee calculation utility function
const calculatePaymentGatewayFee = (amount: number, paymentMethod: string): number => {
  switch (paymentMethod?.toLowerCase()) {
    case 'credit card':
    case 'stripe':
      return amount * 0.03 // 3% for Stripe credit card processing
    case 'bank transfer':
      return amount * 0.005 // 0.5% for bank transfer processing
    case 'crypto':
      return amount * 0.01 // 1% for crypto processing
    case 'airwallex':
    case 'airwallex pay':
      return amount * 0.005 + 0.10 // 0.5% + $0.10 for Airwallex processing
    default:
      return 0 // No fee for internal transfers or unknown payment methods
  }
}

// Get fee percentage display for tooltips
const getFeePercentageDisplay = (paymentMethod: string): string => {
  switch (paymentMethod?.toLowerCase()) {
    case 'credit card':
    case 'stripe':
      return '3%'
    case 'bank transfer':
      return '0.5%'
    case 'crypto':
      return '1%'
    case 'airwallex':
    case 'airwallex pay':
      return '0.5% + $0.10'
    default:
      return '0%'
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

interface Transaction {
  id: string
  display_id?: string
  type: "wallet_deposit" | "ad_account_allocation" | "topup" | "spend" | "refund" | "fee" | "bank_transfer" | "unmatched_transfer"
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

  // Calculate fee statistics for deposits
  const feeStats = useMemo(() => {
    const depositTransactions = filteredTransactions.filter(
      t => t.type === 'wallet_deposit' || t.type === 'bank_transfer'
    )
    
    let totalOriginalAmount = 0
    let totalFees = 0
    let totalNetAmount = 0
    
    depositTransactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount)
      const fee = calculatePaymentGatewayFee(amount, transaction.paymentMethod || '')
      const netAmount = amount - fee
      
      totalOriginalAmount += amount
      totalFees += fee
      totalNetAmount += netAmount
    })
    
    return {
      totalOriginalAmount,
      totalFees,
      totalNetAmount,
      transactionCount: depositTransactions.length
    }
  }, [filteredTransactions])

  const stats = useMemo(() => ({
    total: transactions.length,
    wallet_deposit: transactions.filter(t => t.type === "wallet_deposit").length,
    ad_account_allocation: transactions.filter(t => t.type === "ad_account_allocation").length,
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



  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { 
          color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800", 
          icon: CheckCircle 
        }
      case "pending":
        return { 
          color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800", 
          icon: Clock 
        }
      case "failed":
        return { 
          color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800", 
          icon: X 
        }
      case "cancelled":
        return { 
          color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", 
          icon: X 
        }
      case "unmatched":
        return { 
          color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800", 
          icon: AlertTriangle 
        }
      default:
        return { 
          color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800", 
          icon: Clock 
        }
    }
  }

  const handleTransferAction = async (transaction: Transaction, action: 'completed' | 'failed' | 'ignored') => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({stats.total})</SelectItem>
              <SelectItem value="wallet_deposit">Wallet Deposit ({stats.wallet_deposit})</SelectItem>
              <SelectItem value="ad_account_allocation">Ad Account Allocation ({stats.ad_account_allocation})</SelectItem>
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
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground" style={{ width: 100 }}>Transaction ID</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 90 }}>Type</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 110 }}>Amount</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 90 }}>Gateway Fee</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 110 }}>Net Amount</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 90 }}>Status</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 140 }}>Payment Method</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 160 }}>Organization</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 120 }}>Description</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 100 }}>Date</TableHead>
              <TableHead className="text-muted-foreground" style={{ width: 100 }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div className="font-mono text-xs">
                      {transaction.display_id || transaction.id.substring(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {transaction.type === 'wallet_deposit' ? 'Wallet Deposit' :
                       transaction.type === 'ad_account_allocation' ? 'Ad Account Allocation' :
                       transaction.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      <div className={`${
                        transaction.type === 'wallet_deposit' ? 'text-[#34D197]' :
                        transaction.type === 'ad_account_allocation' ? 'text-blue-400' :
                        transaction.type === 'spend' || transaction.type === 'fee' ? 'text-[#F56565]' : 
                        transaction.amount < 0 ? 'text-[#F56565]' : 'text-[#34D197]'
                      }`}>
                        {transaction.type === 'wallet_deposit' ? '+' :
                         transaction.type === 'ad_account_allocation' ? '→' :
                         transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {transaction.currency}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Only show fees for deposits (when money comes in from payment gateways)
                      const shouldShowFee = transaction.type === 'wallet_deposit' || transaction.type === 'bank_transfer';
                      if (!shouldShowFee) {
                        return <div className="text-center text-muted-foreground text-xs">N/A</div>;
                      }
                      
                      const fee = calculatePaymentGatewayFee(Math.abs(transaction.amount), transaction.paymentMethod || '');
                      const feePercentage = fee > 0 ? ((fee / Math.abs(transaction.amount)) * 100).toFixed(1) : '0';
                      
                      return (
                        <div className="text-right text-xs">
                          {fee > 0 ? (
                            <div>
                              <div className="text-muted-foreground">{formatCurrency(fee)}</div>
                              <div className="text-xs text-muted-foreground">({feePercentage}%)</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No fee</div>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Calculate net amount after gateway fees
                      const shouldShowFee = transaction.type === 'wallet_deposit' || transaction.type === 'bank_transfer';
                      if (!shouldShowFee) {
                        return <div className="text-center text-muted-foreground text-xs">N/A</div>;
                      }
                      
                      const fee = calculatePaymentGatewayFee(Math.abs(transaction.amount), transaction.paymentMethod || '');
                      const netAmount = Math.abs(transaction.amount) - fee;
                      
                      return (
                        <div className="text-right font-medium">
                          <div className="text-[#34D197]">
                            +{formatCurrency(netAmount)}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">
                            {transaction.currency}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const config = getStatusConfig(transaction.status);
                      const Icon = config.icon;
                      return (
                        <Badge className={`text-xs px-1 py-0.5 ${config.color} flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />
                          {transaction.status.replace('_', ' ')}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{transaction.paymentMethod || 'N/A'}</div>
                      {transaction.referenceNumber && (
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {transaction.referenceNumber.length > 20 
                            ? `${transaction.referenceNumber.substring(0, 20)}...`
                            : transaction.referenceNumber}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm truncate">
                      {transaction.organizationName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground truncate" title={transaction.description}>
                      {transaction.description.length > 30 
                        ? `${transaction.description.substring(0, 30)}...`
                        : transaction.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Actions for bank transfers and unmatched transfers */}
                    {(transaction.type === "bank_transfer" || transaction.type === "unmatched_transfer") && (
                      <div className="flex items-center gap-1">
                        {(transaction.status === "pending" || transaction.status === "unmatched") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleTransferAction(transaction, 'completed')}
                              className="bg-[#34D197] hover:bg-[#2bb87d] h-6 text-xs px-2 text-black"
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleTransferAction(transaction, 'failed')}
                              className="h-6 text-xs px-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {transaction.type === "unmatched_transfer" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransferAction(transaction, 'ignored')}
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
                    )}
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