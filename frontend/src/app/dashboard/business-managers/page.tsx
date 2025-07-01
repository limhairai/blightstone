"use client"

import { BusinessManagersTable } from "@/components/business-managers/business-managers-table"
import { ApplyForBmDialog } from "@/components/business-managers/apply-for-bm-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import useSWR from 'swr'
import { useMemo } from 'react'

const fetcher = (url: string, token: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json())

export default function BusinessManagersPage() {
  const { session } = useAuth()
  const { currentOrganizationId } = useOrganizationStore()

  const { data: bms, error, isLoading, mutate } = useSWR(
    session && currentOrganizationId ? ['/api/business-managers', session.access_token] : null,
    ([url, token]) => fetcher(url, token)
  )

  const businessManagers = useMemo(() => {
    if (!bms || !Array.isArray(bms)) return []
    return bms.map((bm: any) => ({
      id: bm.id,
      name: bm.name,
      status: bm.status,
      created_at: bm.created_at,
      ad_account_count: bm.ad_account_count,
      dolphin_business_manager_id: bm.dolphin_business_manager_id,
      binding_id: bm.binding_id,
      asset_id: bm.asset_id,
      is_application: bm.is_application
    }))
  }, [bms])

  const totalManagers = businessManagers.length
  const activeManagers = businessManagers.filter((bm) => bm.status === "active").length
  const totalAccounts = businessManagers.reduce((total, bm) => total + (bm.ad_account_count || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <Building2 className="h-4 w-4 mr-2" />
              Business Managers
            </Button>
          </div>
        </div>

        <ApplyForBmDialog
          onSuccess={() => mutate()}
        >
          <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
            <Plus className="mr-2 h-4 w-4" />
            Apply for Business Manager
          </Button>
        </ApplyForBmDialog>
      </div>

      {/* Compact Metrics */}
      <div className="flex items-center gap-8 text-sm">
        <div>
          <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
            Total Business Managers
          </span>
          <div className="text-foreground font-semibold">
            {totalManagers} ({activeManagers} active)
          </div>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">Total Ad Accounts</span>
          <div className="text-foreground font-semibold">{totalAccounts}</div>
        </div>
      </div>

      {/* Business Managers Table */}
      <BusinessManagersTable businessManagers={businessManagers} loading={isLoading} onRefresh={mutate} />
    </div>
  )
} 