"use client";

import { useState, useEffect, useMemo } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Building, ArrowLeft, Search, MoreHorizontal, Loader2 } from "lucide-react"
import { StatusBadge } from "../ui/status-badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import Link from "next/link"
import { useAuth } from "../../contexts/AuthContext"
import { formatCurrency } from '@/lib/config/financial'
import useSWR from 'swr'

interface AdAccount {
  id: string
  name: string
  account_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  balance_cents?: number
  spend_cents?: number
  business_manager_name?: string
  created_at: string
  last_activity?: string
  timezone?: string
}

interface Business {
  id: string
  name: string
  description?: string
  status: "active" | "pending" | "suspended" | "inactive"
  organization_id: string
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

interface BusinessDetailViewProps {
  businessId: string
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function BusinessDetailView({ businessId }: BusinessDetailViewProps) {
  const { session } = useAuth()
  
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch business data
  const { data: businessData, error, isLoading } = useSWR(
    session && businessId ? [`/api/businesses/${businessId}`, session.access_token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const business: Business | null = businessData?.business || null;
  const adAccounts: AdAccount[] = businessData?.adAccounts || [];

  const filteredAccounts = useMemo(() => {
    return adAccounts.filter((account) => {
      const statusFilter = selectedStatus === "all" || account.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_id.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [adAccounts, selectedStatus, searchTerm])

  // Calculate metrics
  const totalBalance = adAccounts.reduce((sum, acc) => sum + ((acc.balance_cents || 0) / 100), 0);
  const totalSpend = adAccounts.reduce((sum, acc) => sum + ((acc.spend_cents || 0) / 100), 0);
  const activeAccounts = adAccounts.filter(acc => acc.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading business details...</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Business Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested business could not be found.</p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Building className="h-4 w-4 text-foreground" />
        </div>
        <h1 className="text-lg font-semibold">{business.name}</h1>
        <StatusBadge status={business.status} />
        {business.organization && (
          <Badge variant="outline" className="text-xs">
            {business.organization.name}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {adAccounts.length} ad accounts
        </Badge>
      </div>

      {/* Business Info */}
      {business.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{business.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across {adAccounts.length} accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{activeAccounts}</div>
            <p className="text-xs text-muted-foreground">of {adAccounts.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Ad Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ad Accounts</h2>
          <div className="flex items-center gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredAccounts.length} accounts shown
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Business Manager</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">{account.account_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={account.status} size="sm" />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {account.business_manager_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency((account.balance_cents || 0) / 100)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency((account.spend_cents || 0) / 100)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.timezone || 'UTC'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Top-up Balance</DropdownMenuItem>
                            <DropdownMenuItem>View Transactions</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-muted-foreground">
                              Remove from Business
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        {searchTerm || selectedStatus !== "all" 
                          ? "No accounts match your filters."
                          : "No ad accounts found for this business."
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 