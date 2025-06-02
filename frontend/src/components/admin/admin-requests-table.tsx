"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Eye } from "lucide-react"
import Link from "next/link"

type RequestStatus = "pending" | "in_review" | "approved" | "rejected"

interface AdminRequest {
  id: string
  type: "new_account" | "top_up" | "withdrawal" | "account_change"
  clientName: string
  accountName: string
  date: string
  status: RequestStatus
}

export function AdminRequestsTable() {
  // This would come from an API in a real application
  const [requests, setRequests] = useState<AdminRequest[]>([
    {
      id: "req_001",
      type: "new_account",
      clientName: "Acme Inc.",
      accountName: "Summer Campaign 2025",
      date: "Apr 29, 2025",
      status: "pending",
    },
    {
      id: "req_002",
      type: "top_up",
      clientName: "TechStart LLC",
      accountName: "Product Launch Campaign",
      date: "Apr 28, 2025",
      status: "in_review",
    },
    {
      id: "req_003",
      type: "withdrawal",
      clientName: "Global Media",
      accountName: "Q2 Marketing Budget",
      date: "Apr 27, 2025",
      status: "pending",
    },
    {
      id: "req_004",
      type: "account_change",
      clientName: "Retail Solutions",
      accountName: "Holiday Promotion",
      date: "Apr 26, 2025",
      status: "pending",
    },
    {
      id: "req_005",
      type: "new_account",
      clientName: "Startup Ventures",
      accountName: "Seed Round Campaign",
      date: "Apr 25, 2025",
      status: "pending",
    },
  ])

  // Function to get status badge
  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-900/50">
            Pending
          </Badge>
        )
      case "in_review":
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-900/50">
            In Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-900/50">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-900/20 text-red-400 border-red-900/50">
            Rejected
          </Badge>
        )
    }
  }

  // Function to get type label
  const getTypeLabel = (type: AdminRequest["type"]) => {
    switch (type) {
      case "new_account":
        return "New Account"
      case "top_up":
        return "Top Up Request"
      case "withdrawal":
        return "Withdrawal Request"
      case "account_change":
        return "Account Change"
    }
  }

  // In a real app, these would call your API
  const handleApprove = (id: string) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "approved" as RequestStatus } : req)))
  }

  const handleReject = (id: string) => {
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "rejected" as RequestStatus } : req)))
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader className="bg-[#1A1A1A]">
          <TableRow className="border-b-[#222222] hover:bg-transparent">
            <TableHead className="w-[180px] text-[#71717a]">Request Type</TableHead>
            <TableHead className="text-[#71717a]">Client</TableHead>
            <TableHead className="text-[#71717a]">Account/Campaign</TableHead>
            <TableHead className="text-[#71717a]">Date</TableHead>
            <TableHead className="text-[#71717a]">Status</TableHead>
            <TableHead className="text-right text-[#71717a]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id} className="border-b border-[#222222] hover:bg-[#1A1A1A]/30">
              <TableCell className="font-medium">{getTypeLabel(request.type)}</TableCell>
              <TableCell>{request.clientName}</TableCell>
              <TableCell>{request.accountName}</TableCell>
              <TableCell>{request.date}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/requests/${request.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 border-[#222222] bg-[#1A1A1A] hover:bg-[#222222]"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-green-400 hover:text-green-300 border-green-900/30 hover:border-green-900/50 hover:bg-green-900/20"
                    onClick={() => handleApprove(request.id)}
                    disabled={request.status === "approved" || request.status === "rejected"}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="sr-only">Approve</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-red-400 hover:text-red-300 border-red-900/30 hover:border-red-900/50 hover:bg-red-900/20"
                    onClick={() => handleReject(request.id)}
                    disabled={request.status === "approved" || request.status === "rejected"}
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
