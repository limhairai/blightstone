"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Search, UserCog, DollarSign, ChevronRight } from "lucide-react"
import { Input } from "../ui/input"
import Link from "next/link"
import { Avatar, AvatarFallback } from "../ui/avatar"

interface AdminClient {
  id: string
  name: string
  email: string
  accountType: "standard" | "premium" | "enterprise"
  status: "active" | "pending" | "suspended"
  totalSpend: string
  accountsCount: number
  joinDate: string
}

export function AdminClientsList() {
  // This would come from an API in a real application
  const [clients] = useState<AdminClient[]>([
    {
      id: "client_001",
      name: "Acme Industries",
      email: "accounts@acme.com",
      accountType: "premium",
      status: "active",
      totalSpend: "$12,540.00",
      accountsCount: 5,
      joinDate: "Jan 15, 2025",
    },
    {
      id: "client_002",
      name: "TechStart LLC",
      email: "marketing@techstart.io",
      accountType: "standard",
      status: "active",
      totalSpend: "$5,230.00",
      accountsCount: 2,
      joinDate: "Feb 22, 2025",
    },
    {
      id: "client_003",
      name: "Global Media Group",
      email: "ads@globalmedia.com",
      accountType: "enterprise",
      status: "active",
      totalSpend: "$28,750.00",
      accountsCount: 12,
      joinDate: "Nov 5, 2024",
    },
    {
      id: "client_004",
      name: "Retail Solutions Inc",
      email: "marketing@retailsolutions.com",
      accountType: "premium",
      status: "pending",
      totalSpend: "$0.00",
      accountsCount: 0,
      joinDate: "Apr 28, 2025",
    },
    {
      id: "client_005",
      name: "Startup Ventures",
      email: "hello@startupventures.co",
      accountType: "standard",
      status: "suspended",
      totalSpend: "$1,200.00",
      accountsCount: 1,
      joinDate: "Mar 10, 2025",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")

  // Function to get account type badge
  const getAccountTypeBadge = (type: AdminClient["accountType"]) => {
    switch (type) {
      case "standard":
        return (
          <Badge variant="outline" className="bg-slate-900/20 text-slate-400 border-slate-900/50">
            Standard
          </Badge>
        )
      case "premium":
        return (
          <Badge variant="outline" className="bg-secondary/20 text-foreground border-border/50">
            Premium
          </Badge>
        )
      case "enterprise":
        return (
          <Badge variant="outline" className="bg-secondary/20 text-foreground border-border/50">
            Enterprise
          </Badge>
        )
    }
  }

  // Function to get status badge
  const getStatusBadge = (status: AdminClient["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-secondary/20 text-foreground border-border/50">
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border/50">
            Pending
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="outline" className="bg-muted/20 text-muted-foreground border-border/50">
            Suspended
          </Badge>
        )
    }
  }

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9 bg-[#1A1A1A] border-[#222222]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="w-full sm:w-auto bg-primary text-black hover:opacity-90">
          <UserCog className="h-4 w-4 mr-2" /> Add New Client
        </Button>
      </div>

      <div className="rounded-md border border-[#222222] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#1A1A1A]">
            <TableRow className="border-b-[#222222] hover:bg-transparent">
              <TableHead className="text-[#71717a]">Client</TableHead>
              <TableHead className="text-[#71717a]">Type</TableHead>
              <TableHead className="text-[#71717a]">Status</TableHead>
              <TableHead className="text-[#71717a]">Total Spend</TableHead>
              <TableHead className="text-[#71717a]">Accounts</TableHead>
              <TableHead className="text-[#71717a]">Join Date</TableHead>
              <TableHead className="text-right text-[#71717a]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="border-b border-[#222222] hover:bg-[#1A1A1A]/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#1A1A1A] text-xs">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getAccountTypeBadge(client.accountType)}</TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <DollarSign className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {client.totalSpend}
                  </div>
                </TableCell>
                <TableCell>{client.accountsCount}</TableCell>
                <TableCell>{client.joinDate}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/businesses/${client.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 hover:bg-[#1A1A1A]">
                      Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
