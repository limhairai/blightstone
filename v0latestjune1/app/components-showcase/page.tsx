import { PreferencesCard } from "@/components/preference-card"
import { NewsCard } from "@/components/news-card"
import { StockTable } from "@/components/data-table"
import { ChartCard } from "@/components/chart-card"
import { LineChart } from "@/components/line-chart"
import { EmptyState } from "@/components/empty-state"
import { Search, AlertCircle } from "lucide-react"

export default function ComponentsShowcasePage() {
  // Sample data for line chart
  const chartData = [
    { date: "Jan", value: 120 },
    { date: "Feb", value: 150 },
    { date: "Mar", value: 180 },
    { date: "Apr", value: 140 },
    { date: "May", value: 210 },
    { date: "Jun", value: 250 },
    { date: "Jul", value: 190 },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AdHub Component Showcase</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold mb-4">Preferences Card</h2>
            <PreferencesCard />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">News Card</h2>
            <div className="space-y-4">
              <NewsCard
                category="Markets"
                title="Michigan Consumers Sentiments Rises For First Time In 5 Months: Index Up To 67.9, Marking A 2.3% Increase."
                isPositive={true}
                date="Today"
              />
              <NewsCard
                category="Tech"
                title="During Amazon Labor Day Sale, Technical Issues Disrupted The Checkout Process, Preventing Users From Completing Purchases."
                isPositive={false}
                date="Yesterday"
              />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Data Table</h2>
          <StockTable />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold mb-4">Chart Card</h2>
            <ChartCard
              title="Account Balance"
              value="$1,950.00"
              change={{
                value: "+$500.00",
                percentage: "20.1%",
                positive: true,
              }}
            >
              <div className="h-[200px]">
                <LineChart data={chartData} />
              </div>
            </ChartCard>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Empty States</h2>
            <div className="space-y-8">
              <div className="border border-border rounded-lg overflow-hidden">
                <EmptyState
                  icon={Search}
                  title="No matches for your selected criteria"
                  description="Try pressing delete to clear your latest filter, or delete all to clear all."
                  action={{
                    label: "Clear all filters",
                    onClick: () => alert("Clearing filters"),
                  }}
                />
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <EmptyState
                  icon={AlertCircle}
                  title="Your watchlist is empty"
                  description="Open search by hitting / and save your first asset."
                  action={{
                    label: "See headlines",
                    onClick: () => alert("Showing headlines"),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
