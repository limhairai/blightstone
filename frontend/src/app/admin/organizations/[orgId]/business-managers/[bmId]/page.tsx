"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react"
import { Button } from "../../../../../../components/ui/button"
import { Input } from "../../../../../../components/ui/input"
import { Badge } from "../../../../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select"
import { DataTable } from "../../../../../../components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { CreditCard, ArrowLeft, Search, RefreshCw } from "lucide-react"
import { StatusBadge } from "../../../../../../components/admin/status-badge"
import Link from "next/link"
import { useAuth } from "../../../../../../contexts/AuthContext"
import { useParams } from "next/navigation"
import { formatCurrency } from "../../../../../../utils/format"

interface AdAccount {
  id: string
  name: string
  ad_account_id: string
  status: "active" | "pending" | "suspended" | "inactive"
  balance: number
  totalSpend: number
  timezone: string
  metadata?: any
}

interface BusinessManager {
  id: string
  name: string
  dolphin_business_manager_id: string
  status: string
  adAccountsCount: number
}

interface Organization {
  id: string
  name: string
}

export default function BusinessManagerDetailPage() {
  const { session } = useAuth()
  const params = useParams()
  const orgId = params?.orgId as string
  const bmId = params?.bmId as string
  
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [businessManager, setBusinessManager] = useState<BusinessManager | null>(null)
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch business manager and ad accounts data
  const fetchData = async () => {
    if (!orgId || !bmId) return
    
    try {
      setLoading(true)
      
      // Fetch organization details first
      const orgResponse = await fetch(`/api/admin/organizations/${orgId}`)
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData.organization)
        
        // Find the specific business manager
        const bm = orgData.businessManagers?.find((bm: any) => bm.id === bmId)
        if (bm) {
          setBusinessManager(bm)
        }
      }
      
      // Fetch ad accounts for this business manager
      const accountsResponse = await fetch(`/api/ad-accounts?bm_id=${bmId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        setAdAccounts(accountsData.accounts || [])
      } else {
        console.error('Failed to fetch ad accounts:', await accountsResponse.text())
      }
      
    } catch (err) {
      console.error('Error fetching business manager details:', err)
      setError('Failed to fetch business manager details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [orgId, bmId])

  const filteredAdAccounts = useMemo(() => {
    return adAccounts.filter((account) => {
      const statusFilter = selectedStatus === "all" || account.status === selectedStatus
      const searchFilter = searchTerm === "" || 
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.ad_account_id.toLowerCase().includes(searchTerm.toLowerCase())
      return statusFilter && searchFilter
    })
  }, [adAccounts, selectedStatus, searchTerm])

  const columns: ColumnDef<AdAccount>[] = [
    {
      accessorKey: "name",
      header: "Ad Account",
      size: 300,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
            <CreditCard className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground font-mono">{row.original.ad_account_id}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 100,
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} size="sm" />,
    },
    {
      accessorKey: "balance",
      header: "Balance",
      size: 120,
      cell: ({ row }) => {
        const spendCap = row.original.metadata?.spend_cap || 0;
        const amountSpent = row.original.metadata?.amount_spent || 0;
        const calculatedBalance = spendCap - amountSpent;
        return (
          <div className="text-right font-mono">
            {formatCurrency(calculatedBalance)}
          </div>
        );
      },
    },
    {
      accessorKey: "totalSpend",
      header: "Total Spend",
      size: 120,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatCurrency(row.original.metadata?.amount_spent || 0)}
        </div>
      ),
    },
    {
      accessorKey: "timezone",
      header: "Timezone",
      size: 100,
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.timezone || 'UTC'}
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading business manager details...</p>
        </div>
      </div>
    )
  }

  if (error || !organization || !businessManager) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Business Manager Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested business manager could not be found.</p>
          <Link href={`/admin/organizations/${orgId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organization
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
        <Link href={`/admin/organizations/${orgId}`}>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {organization.name}
          </Button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-lg font-semibold">{businessManager.name}</h1>
        <StatusBadge status={businessManager.status} />
        <Badge variant="outline" className="text-xs font-mono">
          ID: {businessManager.dolphin_business_manager_id}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {adAccounts.length} ad accounts
        </Badge>
      </div>

      {/* Ad Accounts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ad Accounts</h2>
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
                placeholder="Search ad accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {filteredAdAccounts.length} ad accounts shown
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredAdAccounts}
        />
      </div>
    </div>
  )
} 