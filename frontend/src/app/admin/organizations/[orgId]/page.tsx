"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Badge } from "../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table"
import { Building, ArrowLeft, Search, RefreshCw, Globe } from "lucide-react"
import { StatusBadge } from "../../../../components/admin/status-badge"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../../contexts/AuthContext"
import { useParams } from "next/navigation"

interface BusinessManager {
  id: string
  name: string
  status: "active" | "pending" | "suspended" | "inactive"
  organizationId: string
  adAccountsCount: number
  dolphin_business_manager_id: string
  totalSpend: number
  monthlyBudget: number
  createdAt: string
  domains: string[]
  domain_count: number
}

interface Organization {
  id: string
  name: string
  created_at: string
}

export default function OrganizationDetailPage() {
  const { session } = useAuth()
  const params = useParams()
  const orgId = params?.orgId as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    if (!session?.access_token || !orgId) return

    setLoading(true)
    try {
      // Fetch organization details
      const orgResponse = await fetch(`/api/admin/organizations/${orgId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      
      if (!orgResponse.ok) {
        throw new Error('Failed to fetch organization')
      }
      
      const orgData = await orgResponse.json()
      setOrganization(orgData.organization)
      
      // Business managers are already included in the organization response
      setBusinessManagers(orgData.businessManagers || [])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [session, orgId])

  const filteredBusinessManagers = useMemo(() => {
    return businessManagers.filter((bm) => {
      const statusFilter = selectedStatus === "all" || bm.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        bm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bm.dolphin_business_manager_id?.includes(searchTerm)
      return statusFilter && searchFilter
    })
  }, [businessManagers, selectedStatus, searchTerm])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading organization...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  if (!organization) {
    return <div className="flex items-center justify-center p-8">Organization not found</div>
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-sm text-muted-foreground">
            Organization ID: <span className="font-mono">{organization.id}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Business Managers</h2>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                placeholder="Search business managers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredBusinessManagers.length} business managers shown
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Business Manager</TableHead>
                <TableHead className="text-muted-foreground">Domains</TableHead>
                <TableHead className="text-muted-foreground">Business Manager ID</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Ad Accounts</TableHead>
                <TableHead className="text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinessManagers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No business managers found for this organization.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBusinessManagers.map((bm) => (
                  <TableRow key={bm.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
                          <Building className="h-4 w-4 text-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{bm.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {bm.adAccountsCount} ad accounts
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {bm.domains && bm.domains.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {bm.domains.slice(0, 3).map((domain: string, index: number) => (
                              <div 
                                key={index} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-muted/40 rounded text-xs"
                                title={domain}
                              >
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[100px]">{domain}</span>
                              </div>
                            ))}
                            {bm.domains.length > 3 && (
                              <div className="inline-flex items-center px-2 py-1 bg-muted/20 rounded text-xs text-muted-foreground">
                                +{bm.domains.length - 3} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">No domains</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {bm.dolphin_business_manager_id ? 
                          `${bm.dolphin_business_manager_id.substring(0, 12)}...` : 
                          'N/A'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={bm.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div className="text-center font-medium">
                        {bm.adAccountsCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/organizations/${orgId}/business-managers/${bm.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
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