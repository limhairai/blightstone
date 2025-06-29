"use client"

import { useSearchParams } from "next/navigation"
import { CompactHeaderMetrics } from "@/components/compact-header-metrics"
import { CompactAccountsTable } from "@/components/compact-accounts-table"
import { CreateAdAccountDialog } from "@/components/create-ad-account-dialog"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid } from "lucide-react"
import { MOCK_BUSINESSES } from "@/data/mock-businesses"
import { useState } from "react"

export default function AccountsPage() {
  const searchParams = useSearchParams()
  const initialBusinessFilter = searchParams.get("business") || "all"
  const [businessFilter, setBusinessFilter] = useState<string>(initialBusinessFilter)

  return (
    <div className="dark">
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header with metrics */}
            <div className="space-y-4">
              {/* Tab-like navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-foreground bg-accent">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Accounts
                    </Button>
                  </div>
                </div>

                <CreateAdAccountDialog
                  trigger={
                    <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
                      <Plus className="mr-2 h-4 w-4" />
                      Request Account
                    </Button>
                  }
                />
              </div>

              {/* Compact Metrics */}
              <CompactHeaderMetrics />
            </div>

            {/* Business Filter Bar - moved here above the table */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border mb-4">
              <Button
                variant={businessFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setBusinessFilter("all")}
                className="whitespace-nowrap"
              >
                All Businesses
              </Button>
              {MOCK_BUSINESSES.map((business) => (
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

            {/* Accounts Table */}
            <CompactAccountsTable
              initialBusinessFilter={businessFilter || "all"}
              businessFilter={businessFilter}
              onBusinessFilterChange={setBusinessFilter}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
