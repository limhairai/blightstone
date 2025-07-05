"use client"

import { useSearchParams } from "next/navigation"
import { CompactAccountsTable } from "@/components/dashboard/compact-accounts-table"
import { CreateAdAccountDialog } from "@/components/accounts/create-ad-account-dialog"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, ArrowLeft } from "lucide-react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { useBusinessManagers } from '@/lib/swr-config'

export default function AccountsPage() {
  const { session } = useAuth();
  const { currentOrganizationId } = useOrganizationStore();
  const searchParams = useSearchParams()
  const router = useRouter()
  const bmId = searchParams.get('bm_id')
  const initialBusinessFilter = searchParams.get("business") || "all"
  const [businessFilter, setBusinessFilter] = useState<string>(initialBusinessFilter)

  // Fetch business managers for filter options with organization ID
  const { data: businessManagers } = useBusinessManagers(currentOrganizationId);

  const businessManagerOptions = useMemo(() => {
    if (!Array.isArray(businessManagers)) return [];
    return businessManagers.map((bm: any) => ({
      id: bm.id,
      name: bm.name || bm.metadata?.business_manager || `BM ${bm.id}`,
      dolphin_id: bm.dolphin_id
    }));
  }, [businessManagers]);

  const handleBack = () => {
    router.push('/dashboard/business-managers');
  };

  // Find the business manager name for the title if we have a bm_id filter
  const businessManagerName = useMemo(() => {
    if (!bmId || !Array.isArray(businessManagers)) return null;
    const bm = businessManagers.find((bm: any) => bm.dolphin_id === bmId);
    return bm?.name || bm?.metadata?.business_manager || null;
  }, [bmId, businessManagers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {bmId && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-foreground bg-accent">
              <LayoutGrid className="h-4 w-4 mr-2" />
              {bmId && businessManagerName 
                ? `${businessManagerName} - Ad Accounts`
                : 'Ad Accounts'
              }
            </Button>
          </div>
        </div>

        <CreateAdAccountDialog
          bmId={bmId}
          trigger={
            <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
              <Plus className="mr-2 h-4 w-4" />
              Request Account
            </Button>
          }
        />
      </div>

      {/* Business Filter Bar - only show if not filtered by specific BM */}
      {!bmId && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
          <Button
            variant={businessFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setBusinessFilter("all")}
            className="whitespace-nowrap"
          >
            All Businesses
          </Button>
          {businessManagerOptions.map((business) => (
            <Button
              key={business.id}
              variant={businessFilter === business.name ? "default" : "outline"}
              size="sm"
              onClick={() => setBusinessFilter(business.name)}
              className="whitespace-nowrap"
            >
              {business.name}
            </Button>
          ))}
        </div>
      )}

      {/* Accounts Table */}
      <CompactAccountsTable
        initialBusinessFilter={businessFilter || "all"}
        businessFilter={businessFilter}
        onBusinessFilterChange={setBusinessFilter}
        bmIdFilter={bmId}
      />
    </div>
  )
} 