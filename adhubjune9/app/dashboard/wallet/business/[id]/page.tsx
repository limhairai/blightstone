"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Topbar } from "@/components/topbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/utils/format"
import { BusinessAccountsTable } from "@/components/business-accounts-table"
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, Calendar, Info } from "lucide-react"

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.id as string

  const [timeFilter, setTimeFilter] = useState("Last 7 days")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Mock business data - in real app, fetch based on businessId
  const business = {
    id: businessId,
    name: "TechFlow Solutions",
    logo: "/placeholder.svg?height=40&width=40&text=TF",
    allocated: 2800.0,
    spent: 1850.0,
    remaining: 950.0,
    accounts: 2,
    monthlySpend: 1250.0,
    dailyAvg: 41.67,
    peakDay: 126.64,
    change24h: 2.4,
    change7d: 15.2,
    status: "active" as const,
    utilization: 66,
    website: "https://techflow.com",
    description: "Leading software development and consulting company specializing in enterprise solutions.",
  }

  // Generate spending data
  const spendingData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const baseSpend = 80 + Math.sin(i * 0.3) * 40
      const weekendMultiplier = i % 7 === 0 || i % 7 === 6 ? 0.6 : 1
      const randomVariation = Math.random() * 30 - 15

      return {
        index: i,
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        value: Math.max(20, baseSpend * weekendMultiplier + randomVariation),
        accounts: Math.floor(Math.random() * 2) + 1,
      }
    })
  }, [])

  return (
    <div className="dark">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <DashboardSidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar pageTitle="Business Details" showEmptyStateElements={false} />

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wallet
                </Button>
              </div>

              {/* Business Header */}
              <div className="flex items-center gap-4 mb-6">
                <img src={business.logo || "/placeholder.svg"} alt={business.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">Active</Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">{business.accounts} accounts</span>
                    {business.website && (
                      <>
                        <span className="text-sm text-muted-foreground">•</span>
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#c4b5fd] hover:text-[#a855f7]"
                        >
                          Website
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Clean Minimalist Metrics Section */}
              <div className="space-y-6">
                {/* Date Range Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Business metrics for</span>
                  <span className="font-medium">{business.name}</span>
                  <span className="text-sm text-muted-foreground">from</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {timeFilter}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTimeFilter("Today")}>Today</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("Last 7 days")}>Last 7 days</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("Last 30 days")}>Last 30 days</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("This month")}>This month</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTimeFilter("Last month")}>Last month</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Main Metrics Row */}
                <div className="grid grid-cols-5 gap-6 py-3 border-b border-border">
                  <div>
                    <div className="text-lg font-semibold">${formatCurrency(business.remaining)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Available balance</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">${formatCurrency(business.allocated)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total allocated</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">${formatCurrency(business.monthlySpend)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Monthly spend</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">${formatCurrency(business.dailyAvg)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Average daily cost</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{business.utilization}%</div>
                    <div className="text-xs text-muted-foreground mt-1">Utilization</div>
                  </div>
                </div>

                {/* Secondary Metrics Row */}
                <div className="grid grid-cols-4 gap-6 pt-3">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium">${formatCurrency(business.peakDay)}</span>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Peak day spend</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-base font-medium ${business.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {business.change24h >= 0 ? "+" : ""}
                        {business.change24h}%
                      </span>
                      {business.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">24h change</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-base font-medium ${business.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {business.change7d >= 0 ? "+" : ""}
                        {business.change7d}%
                      </span>
                      {business.change7d >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">7d change</div>
                  </div>
                  <div>
                    <div className="text-base font-medium">{business.accounts}</div>
                    <div className="text-xs text-muted-foreground mt-1">Active accounts</div>
                  </div>
                </div>
              </div>

              {/* Spending Chart */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Spending Trends</h2>
                </div>
                <div className="h-64 w-full relative bg-card border border-border rounded-lg p-4">
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />

                    {/* Spending line */}
                    <path
                      d={`M ${spendingData
                        .map(
                          (point, i) =>
                            `${(i / (spendingData.length - 1)) * 100},${100 - (point.value / Math.max(...spendingData.map((p) => p.value))) * 80}`,
                        )
                        .join(" L ")}`}
                      fill="none"
                      stroke="url(#spendingGradient)"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Gradient fill */}
                    <path
                      d={`M ${spendingData
                        .map(
                          (point, i) =>
                            `${(i / (spendingData.length - 1)) * 100},${100 - (point.value / Math.max(...spendingData.map((p) => p.value))) * 80}`,
                        )
                        .join(" L ")} L 100,100 L 0,100 Z`}
                      fill="url(#spendingFill)"
                      opacity="0.3"
                    />

                    <defs>
                      <linearGradient id="spendingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#ffc4b5" />
                      </linearGradient>
                      <linearGradient id="spendingFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Interactive hover points */}
                  {spendingData.map((point, i) => {
                    const yPosition = 100 - (point.value / Math.max(...spendingData.map((p) => p.value))) * 80
                    return (
                      <div
                        key={i}
                        className="absolute w-8 h-8 -translate-x-4 -translate-y-4 cursor-pointer z-20 flex items-center justify-center"
                        style={{
                          left: `${(i / (spendingData.length - 1)) * 100}%`,
                          top: `${yPosition}%`,
                        }}
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-all ${
                            hoveredIndex === i ? "bg-[#c4b5fd] scale-150 shadow-lg opacity-100" : "opacity-0"
                          }`}
                        />
                        {hoveredIndex === i && (
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-30">
                            <div className="font-medium">${formatCurrency(point.value)}</div>
                            <div className="text-muted-foreground">{point.date}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Business-Specific Ad Accounts Table */}
              <div className="mt-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Ad Accounts</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and manage ad accounts associated with this business
                  </p>
                </div>
                <BusinessAccountsTable businessName={business.name} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
