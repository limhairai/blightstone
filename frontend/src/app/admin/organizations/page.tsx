"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Building2, Search } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { DataTable } from "../../../components/ui/data-table"
import { Badge } from "../../../components/ui/badge"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../../../contexts/AuthContext"

interface Organization {
  organization_id: string
  name: string
  plan_id: string
  balance_cents: number
  business_managers_count: number
  created_at: string
  subscription_status?: string
}

export default function OrganizationsPage() {
  const { session } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch real organizations data
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!session?.access_token) return

      try {
        // Admins should fetch from the dedicated admin endpoint.
        const response = await fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch organizations')
        }
        
        const data = await response.json()
        setOrganizations(data.organizations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [session])

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const planFilter = selectedPlan === "all" || org.plan_id === selectedPlan
      const searchFilter = searchTerm === "" || 
        org.name.toLowerCase().includes(searchTerm.toLowerCase())

      return planFilter && searchFilter
    })
  }, [organizations, selectedPlan, searchTerm])
  
  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading organizations...</div>
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error}</div>
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Organization",
      size: 250,
      cell: ({ row }: { row: { original: Organization; getValue: (key: string) => any } }) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground truncate">
              ID: {row.original.organization_id.substring(0, 8)}... • {new Date(row.original.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "plan_id",
      header: "Plan",
      size: 120,
      cell: ({ row }: { row: { getValue: (key: string) => any } }) => (
        <Badge variant="secondary" className="truncate capitalize">
          {row.getValue("plan_id") || "Free"}
        </Badge>
      ),
    },
    {
      accessorKey: "business_managers_count",
      header: "Business Managers",
      size: 140,
      cell: ({ row }: { row: { original: Organization } }) => (
        <div className="text-center font-medium">{row.original.business_managers_count}</div>
      ),
    },
    {
      accessorKey: "balance_cents",
      header: "Balance",
      size: 120,
      cell: ({ row }: { row: { original: Organization } }) => (
        <div className="text-right font-medium">
          ${(row.original.balance_cents / 100).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      size: 50,
      cell: ({ row }: { row: { original: Organization } }) => (
        <Link href={`/admin/organizations/${row.original.organization_id}`} className="inline-flex">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      ),
    },
  ]

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

      <DataTable
        columns={columns}
        data={filteredOrganizations}
        searchKey="name"
        searchPlaceholder="Search organizations..."
      />
    </div>
  )
} 