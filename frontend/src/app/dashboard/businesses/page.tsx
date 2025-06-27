"use client"

import useSWR from 'swr'
import { useOrganizationStore } from '../../../lib/stores/organization-store'
import { BusinessesTable } from "../../../components/businesses/client-businesses-table"
import { CreateBusinessDialog } from "../../../components/businesses/create-business-dialog"
import { Button } from "../../../components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { formatCurrency } from "../../../utils/format"
import { layout } from "../../../lib/layout-utils"
import { contentTokens } from "../../../lib/content-tokens"
import { Loader } from '@/components/core/Loader'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BusinessesPage() {
  const { currentOrganizationId, setCurrentOrganizationId } = useOrganizationStore();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // This effect is a temporary solution to bridge the gap from the old context.
  // It ensures an organization is selected when the page loads if one isn't already.
  // In a full refactor, an organization selector UI would handle this.
  useEffect(() => {
    if (user && !currentOrganizationId) {
      // Logic to fetch user's orgs and set the first one
      const fetchAndSetOrg = async () => {
        const res = await fetch('/api/organizations');
        if (res.ok) {
          const data = await res.json();
          if (data.organizations && data.organizations.length > 0) {
            setCurrentOrganizationId(data.organizations[0].id);
          }
        }
      };
      fetchAndSetOrg();
    }
  }, [user, currentOrganizationId, setCurrentOrganizationId]);

  const { data, error, isLoading, mutate } = useSWR(
    currentOrganizationId ? `/api/businesses?organization_id=${currentOrganizationId}` : null,
    fetcher
  );

  if (isLoading) return <Loader fullScreen />;
  if (error) return <div>Failed to load businesses.</div>;

  const businesses = data?.businesses || [];
  
  // Calculate metrics from fetched businesses
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter((b: any) => b.status === "active").length;
  // Count applications in review/processing states as pending
  const pendingBusinesses = businesses.filter((b: any) => 
    ['In Review', 'Processing', 'Ready', 'pending'].includes(b.status)
  ).length;
  const totalBalance = businesses.reduce((total: number, business: any) => total + (business.balance || 0), 0);

  return (
    <div className={layout.pageContent}>
      {/* Header */}
      <div className={layout.stackMedium}>
        {/* Title and Button */}
        <div className={layout.flexBetween}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-foreground bg-accent">
                <Building2 className="h-4 w-4 mr-2" />
                Business Managers
              </Button>
            </div>
          </div>

          {/* Create Business Button */}
          <CreateBusinessDialog 
            open={createDialogOpen} 
            onOpenChange={setCreateDialogOpen}
            onSuccess={() => {
              mutate();
              setCreateDialogOpen(false);
            }}
          >
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Business
            </Button>
          </CreateBusinessDialog>
        </div>

        {/* Compact Metrics */}
        <div className="flex items-center gap-8 text-sm">
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
              Total Business Managers
            </span>
            <div className="text-foreground font-semibold">
              {totalBusinesses} ({activeBusinesses} active, {pendingBusinesses} pending)
            </div>
          </div>
          <div>
            <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
              Total Balance
            </span>
            <div className="text-foreground font-semibold">{formatCurrency(totalBalance)}</div>
          </div>
        </div>
      </div>

      {/* Business Managers Table */}
      <BusinessesTable businesses={businesses} loading={isLoading} onRefresh={() => mutate()} />
    </div>
  )
} 