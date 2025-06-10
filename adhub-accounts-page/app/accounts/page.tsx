"use client"

import { useSearchParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { CompactHeaderMetrics } from "@/components/compact-header-metrics"
import { CompactAccountsTable } from "@/components/compact-accounts-table"
import { CreateAdAccountDialog } from "@/components/create-ad-account-dialog"
import { Button } from "@/components/ui/button"
import { Plus, LayoutGrid, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AccountsPage() {
  const searchParams = useSearchParams()
  const businessFilter = searchParams.get("business")

  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar pageTitle={businessFilter ? `${businessFilter} - Ad Accounts` : "Ad Accounts"} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              {/* Header with metrics */}
              <div className="space-y-4">
                {/* Tab-like navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {businessFilter && (
                      <Link href="/businesses">
                        <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Businesses
                        </Button>
                      </Link>
                    )}
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

              {/* Accounts Table */}
              <CompactAccountsTable initialBusinessFilter={businessFilter || "all"} />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
