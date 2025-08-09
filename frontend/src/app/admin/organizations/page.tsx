"use client";

// Force dynamic rendering for authentication-protected page
export const dynamic = 'force-dynamic';

import { Building2, RefreshCw, ChevronRight } from "lucide-react"
import { TableSkeleton } from "../../../components/ui/skeleton"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { AdminDataTable } from "../../../components/admin/admin-data-table"
import useSWR from 'swr'
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
  ad_accounts_count: number
  pixels_count: number
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
  
  // Use SWR for better caching and performance
  const { data, error, isLoading, mutate } = useSWR(
    session?.access_token ? ['/api/admin/organizations', session.access_token] : null,
    ([url, token]) => fetcher(url, token)
    // Using default SWR configuration for simplicity
  )

  const organizations = data?.organizations || []
  
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <TableSkeleton phase={isLoading ? 1 : 2} rows={6} />
      </div>
    )
  }
  
  if (error) {
    return <div className="flex items-center justify-center p-8 text-red-500">Error: {error.message}</div>
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">{organizations.length} organizations total</div>
      </div>

      <AdminDataTable
        data={organizations}
        columns={[
          {
            key: 'name',
            label: 'Organization',
                         render: (value, item) => (
               <div className="flex items-center gap-2 min-w-0">
                 <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                   <Building2 className="h-4 w-4 text-foreground" />
                 </div>
                 <div className="min-w-0 flex-1">
                   <div className="font-medium truncate">{value}</div>
                   <div className="text-xs text-muted-foreground truncate">
                     ID: {(item as any).organization_id?.substring(0, 8) || 'N/A'}... • {(item as any).created_at ? new Date((item as any).created_at).toLocaleDateString() : 'N/A'}
                   </div>
                 </div>
               </div>
             ),
            width: 220
          },
          {
            key: 'plan_id',
            label: 'Plan',
            render: (value) => (
              <Badge variant="secondary" className="truncate capitalize">
                {value || "Free"}
              </Badge>
            ),
            width: 100
          },
          {
            key: 'business_managers_count',
            label: 'BMs',
            render: (value) => <div className="text-center font-medium">{value}</div>,
            sortable: true,
            width: 80
          },
          {
            key: 'ad_accounts_count', 
            label: 'Accounts',
            render: (value) => <div className="text-center font-medium">{value}</div>,
            sortable: true,
            width: 80
          },
          {
            key: 'pixels_count',
            label: 'Pixels',
            render: (value) => <div className="text-center font-medium">{value}</div>,
            sortable: true,
            width: 80
          },
          {
            key: 'balance_cents',
            label: 'Balance',
                         render: (value, item) => (
               <div className="text-right font-medium">
                 ${(value / 100).toFixed(2)}
                 {(item as any).reserved_balance_cents && (item as any).reserved_balance_cents > 0 && (
                   <div className="text-xs text-muted-foreground">
                     Available: ${(((item as any).available_balance_cents || 0) / 100).toFixed(2)}
                   </div>
                 )}
               </div>
             ),
            sortable: true,
            width: 120
          }
        ]}
        filters={[
          {
            key: 'plan_id',
            label: 'Plans',
            options: [
              { value: 'free', label: 'Free', count: organizations.filter((o: any) => !o.plan_id || o.plan_id === 'free').length },
              { value: 'starter', label: 'Starter', count: organizations.filter((o: any) => o.plan_id === 'starter').length },
              { value: 'growth', label: 'Growth', count: organizations.filter((o: any) => o.plan_id === 'growth').length },
              { value: 'scale', label: 'Scale', count: organizations.filter((o: any) => o.plan_id === 'scale').length }
            ]
          }
        ]}
        searchPlaceholder="Search organizations by name, ID..."
        actions={(item) => (
          <Link href={`/admin/organizations/${(item as any).organization_id || (item as any).id}`} className="inline-flex">
            <ChevronRight className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Link>
        )}
        emptyState={
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No organizations found</h3>
            <p className="text-muted-foreground">No organizations match your search criteria.</p>
          </div>
        }
      />
    </div>
  )
} 