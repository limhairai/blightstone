"use client"

import { BusinessesTable } from "@/components/businesses/businesses-table"
import { CreateBusinessDialog } from "@/components/businesses/create-business-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import { formatCurrency } from "@/lib/mock-data"
import { layout } from "@/lib/layout-utils"
import { contentTokens } from "@/lib/content-tokens"
import { useDemoState } from "@/contexts/DemoStateContext"

export default function BusinessesPage() {
  const { state } = useDemoState()
  
  // Use real-time data from demo state
  const totalBusinesses = state.businesses.length
  const activeBusinesses = state.businesses.filter((b) => b.status === "active").length
  const totalBalance = state.businesses.reduce((total, business) => total + business.totalBalance, 0)

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
                Businesses
              </Button>
            </div>
          </div>

          <CreateBusinessDialog
            trigger={
              <Button className="bg-gradient-to-r from-[#c4b5fd] to-[#ffc4b5] hover:opacity-90 text-black border-0">
                <Plus className="mr-2 h-4 w-4" />
                {contentTokens.actions.create} Business
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
  )
} 