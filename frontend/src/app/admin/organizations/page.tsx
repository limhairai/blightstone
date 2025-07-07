"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Building2, Search } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Badge } from "../../../components/ui/badge"
import useSWR from 'swr'
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../contexts/AuthContext"

interface Organization {
  organization_id: string
  name: string
  plan_id: string
  balance_cents: number
  available_balance_cents?: number
  reserved_balance_cents?: number
  business_managers_count: number
  created_at: string
  subscription_status?: string
}

const fetcher = async (url: string, token: string) => {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch organizations')
  }
  return response.json()
}

export default function OrganizationsPage() {
  const { session } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Use SWR for better caching and performance
  const { data, error, isLoading, mutate } = useSWR(
    session?.access_token ? ['/api/admin/organizations', session.access_token] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  )

  const organizations = data?.organizations || []

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org: Organization) => {
      const planFilter = selectedPlan === "all" || org.plan_id === selectedPlan
      const searchFilter = searchTerm === "" || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase())

      return planFilter && searchFilter
    })
  }, [organizations, selectedPlan, searchTerm])
  
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading organizations...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error.message}</div>
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              <SelectItem value="scale">Scale</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-muted-foreground">{filteredOrganizations.length} organizations total</div>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground" style={{ width: 250 }}>Organization</TableHead>
                <TableHead className="text-muted-foreground" style={{ width: 120 }}>Plan</TableHead>
                <TableHead className="text-muted-foreground" style={{ width: 140 }}>Business Managers</TableHead>
                <TableHead className="text-muted-foreground" style={{ width: 120 }}>Balance</TableHead>
                <TableHead className="text-muted-foreground" style={{ width: 50 }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org: Organization) => (
                  <TableRow key={org.organization_id} className="border-border hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{org.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            ID: {org.organization_id.substring(0, 8)}... • {new Date(org.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="truncate capitalize">
                        {org.plan_id || "Free"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center font-medium">{org.business_managers_count}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-right font-medium">
                        ${(org.balance_cents / 100).toFixed(2)}
                        {org.reserved_balance_cents && org.reserved_balance_cents > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Available: ${((org.available_balance_cents || 0) / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/organizations/${org.organization_id}`} className="inline-flex">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
} 