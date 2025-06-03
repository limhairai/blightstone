"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DollarSign, Search, Calendar, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react"

type TransactionType = "deposit" | "withdrawal" | "transfer" | "fee"
type TransactionStatus = "completed" | "pending" | "failed"

interface Transaction {
  id: string
  date: string
  description: string
  accountName: string
  amount: string
  type: TransactionType
  status: TransactionStatus
}

export function AdminClientTransactions({ clientId }: { clientId: string }) {
  // This would come from an API in a real application
  const [transactions] = useState<Transaction[]>([
    {
      id: "txn_001",
      date: "Apr 28, 2025",
      description: "Account Top-Up",
      accountName: "Summer Campaign 2025",
      amount: "$5,000.00",
      type: "deposit",
      status: "completed",
    },
    {
      id: "txn_002",
      date: "Apr 15, 2025",
      description: "Platform Fee",
      accountName: "Product Launch Q2",
      amount: "$175.00",
      type: "fee",
      status: "completed",
    },
    {
      id: "txn_003",
      date: "Apr 10, 2025",
      description: "Account Top-Up",
      accountName: "Brand Awareness",
      amount: "$2,500.00",
      type: "deposit",
      status: "completed",
    },
    {
      id: "txn_004",
      date: "Apr 05, 2025",
      description: "Transfer Between Accounts",
      accountName: "Multiple Accounts",
      amount: "$1,000.00",
      type: "transfer",
      status: "completed",
    },
    {
      id: "txn_005",
      date: "Apr 01, 2025",
      description: "Refund Processing",
      accountName: "Retargeting Campaign",
      amount: "$500.00",
      type: "withdrawal",
      status: "pending",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")

  // Function to get type badge
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Deposit
          </Badge>
        )
      case "withdrawal":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
            Withdrawal
          </Badge>
        )
      case "transfer":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Transfer
          </Badge>
        )
      case "fee":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            Fee
          </Badge>
        )
    }
  }

  // Function to get status badge
  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Failed
          </Badge>
        )
    }
  }

  // Function to get type icon
  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-4 w-4 text-green-600" />
      case "withdrawal":
        return <ArrowUpFromLine className="h-4 w-4 text-amber-600" />
      case "transfer":
        return <RefreshCw className="h-4 w-4 text-blue-600" />
      case "fee":
        return <DollarSign className="h-4 w-4 text-purple-600" />
    }
  }

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.accountName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-border w-full sm:w-auto">
          <Calendar className="h-4 w-4 mr-2" /> Filter by Date
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="border-b hover:bg-secondary/10">
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>{transaction.accountName}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.type)}
                    {getTypeBadge(transaction.type)}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell className="text-right font-medium">{transaction.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
