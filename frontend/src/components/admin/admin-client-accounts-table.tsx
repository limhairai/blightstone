"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, DollarSign, BarChart3, Edit } from "lucide-react"

interface AdminClientAccount {
  id: string
  name: string
  platform: string
  status: "active" | "pending" | "paused" | "suspended"
  balance: string
  spendLimit: string
  dateCreated: string
}

// Define props interface
interface AdminClientAccountsTableProps {
  clientId: string
  isSuperuser: boolean
}

export function AdminClientAccountsTable({ clientId, isSuperuser }: AdminClientAccountsTableProps) {
  // This would come from an API in a real application
  // TODO: Use isSuperuser prop if needed for data fetching or conditional rendering
  const [accounts, setAccounts] = useState<AdminClientAccount[]>([
    {
      id: "acct_001",
      name: "Summer Campaign 2025",
      platform: "Meta",
      status: "active",
      balance: "$3,450.00",
      spendLimit: "$10,000.00",
      dateCreated: "Jan 20, 2025",
    },
    {
      id: "acct_002",
      name: "Product Launch Q2",
      platform: "Google Ads",
      status: "active",
      balance: "$5,200.00",
      spendLimit: "$15,000.00",
      dateCreated: "Feb 05, 2025",
    },
    {
      id: "acct_003",
      name: "Brand Awareness",
      platform: "TikTok",
      status: "paused",
      balance: "$1,890.00",
      spendLimit: "$5,000.00",
      dateCreated: "Mar 12, 2025",
    },
    {
      id: "acct_004",
      name: "Retargeting Campaign",
      platform: "Meta",
      status: "active",
      balance: "$2,000.00",
      spendLimit: "$7,500.00",
      dateCreated: "Apr 01, 2025",
    },
    {
      id: "acct_005",
      name: "Q3 Marketing Initiative",
      platform: "Google Ads",
      status: "pending",
      balance: "$0.00",
      spendLimit: "$12,000.00",
      dateCreated: "Apr 28, 2025",
    },
  ])

  // Function to get status badge
  const getStatusBadge = (status: AdminClientAccount["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pending
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Paused
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Suspended
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Ad Accounts</h3>
        <Button className="bg-[#b19cd9] hover:bg-[#9f84ca] text-white">Add New Account</Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/20">
            <TableRow>
              <TableHead>Account Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Spend Limit</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} className="border-b hover:bg-secondary/10">
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>{account.platform}</TableCell>
                <TableCell>{getStatusBadge(account.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {account.balance}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {account.spendLimit}
                  </div>
                </TableCell>
                <TableCell>{account.dateCreated}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="sr-only">View Performance</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Account</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
