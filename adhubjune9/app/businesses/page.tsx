"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { BusinessesTable } from "@/components/businesses-table"
import { CreateBusinessDialog } from "@/components/create-business-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { MOCK_BUSINESSES } from "@/data/mock-businesses"
import { formatCurrency } from "@/utils/format"

export default function BusinessesPage() {
  const totalBusinesses = MOCK_BUSINESSES.length
  const activeBusinesses = MOCK_BUSINESSES.filter((b) => b.status === "active").length
  const totalBalance = MOCK_BUSINESSES.reduce((total, business) => total + business.totalBalance, 0)

  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar pageTitle="Businesses" showEmptyStateElements={false} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
              {/* Header */}
              <div className="space-y-4">
                {/* Title and Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-foreground bg-accent">
                        <Building2 className="h-4 w-4 mr-2" />
                        Businesses
                      </Button>
                    </div>
                  </div>

                  <CreateBusinessDialog
                    trigger={
                      <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
                        <Plus className="mr-2 h-4 w-4" />
                        Apply for Business
                      </Button>
                    }
                  />
                </div>

                {/* Compact Metrics */}
                <div className="flex items-center gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
                      Total Businesses
                    </span>
                    <div className="text-foreground font-semibold">
                      {totalBusinesses} ({activeBusinesses} active)
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wide text-xs font-medium">
                      Total Balance
                    </span>
                    <div className="text-foreground font-semibold">${formatCurrency(totalBalance)}</div>
                  </div>
                </div>
              </div>

              {/* Businesses Table */}
              <BusinessesTable />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
