"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "../../../../../components/ui/button"
import { Badge } from "../../../../../components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../components/ui/dropdown-menu"
import { formatCurrency, MOCK_BUSINESSES } from "../../../../../lib/mock-data"
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, Calendar, Info, ExternalLink } from 'lucide-react'
import { layout } from "../../../../../lib/layout-utils"
import { contentTokens } from "../../../../../lib/content-tokens"
import { layoutTokens } from "../../../../../lib/design-tokens"
import { usePageTitle } from "../../../../../components/core/simple-providers"

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = (params?.id as string) || ""
  const { setPageTitle } = usePageTitle()

  const [timeFilter, setTimeFilter] = useState("Last 7 days")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Find business from mock data
  const business = MOCK_BUSINESSES.find(b => b.id === businessId) || {
    id: businessId,
    name: "TechFlow Solutions",
    industry: "Technology",
    status: "active" as const,
    dateCreated: "2024-01-15",
    verification: "verified" as const,
    accountsCount: 2,
    totalBalance: 2800.0,
    bmId: "BM-123456",
    website: "https://techflow.com",
  }

  // Set page title to business name for the topbar
  useEffect(() => {
    setPageTitle(business.name)
  }, [business.name, setPageTitle])

  // Set document title dynamically
  useEffect(() => {
    document.title = `${business.name} - Business Details | AdHub`
    
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = "AdHub - Ad Account Management Platform"
    }
  }, [business.name])

  // Enhanced business data with analytics
  const businessAnalytics = {
    ...business,
    allocated: business.totalBalance + 1000,
    spent: 1850.0,
    remaining: business.totalBalance,
    monthlySpend: 1250.0,
    dailyAvg: 41.67,
    peakDay: 126.64,
    change24h: 2.4,
    change7d: 15.2,
    utilization: Math.round((1850 / (business.totalBalance + 1000)) * 100),
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
    <div className={layout.pageContent}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {contentTokens.actions.back} to Wallet
        </Button>
      </div>

      {/* Business Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#c4b5fd] to-[#ffc4b5] flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {business.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700">
              {contentTokens.status.active}
            </Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{business.accountsCount} accounts</span>
            {business.website && (
              <>
                <span className="text-sm text-muted-foreground">•</span>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#c4b5fd] hover:text-[#a855f7] flex items-center gap-1"
                >
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Clean Minimalist Metrics Section */}
      <div className={layout.stackLarge}>
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Business metrics for</span>
          <span className="font-medium">{business.name}</span>
          <span className="text-sm text-muted-foreground">from</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 border-border text-foreground hover:bg-accent">
                <Calendar className="h-3.5 w-3.5" />
                {timeFilter}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => setTimeFilter("Today")} className="text-popover-foreground hover:bg-accent">Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("Last 7 days")} className="text-popover-foreground hover:bg-accent">Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("Last 30 days")} className="text-popover-foreground hover:bg-accent">Last 30 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("This month")} className="text-popover-foreground hover:bg-accent">This month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeFilter("Last month")} className="text-popover-foreground hover:bg-accent">Last month</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Metrics Row */}
        <div className="grid grid-cols-5 gap-6 py-3 border-b border-border">
          <div>
            <div className="text-lg font-semibold text-foreground">${formatCurrency(businessAnalytics.remaining)}</div>
            <div className="text-xs text-muted-foreground mt-1">Available balance</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">${formatCurrency(businessAnalytics.allocated)}</div>
            <div className="text-xs text-muted-foreground mt-1">Total allocated</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">${formatCurrency(businessAnalytics.monthlySpend)}</div>
            <div className="text-xs text-muted-foreground mt-1">Monthly spend</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">${formatCurrency(businessAnalytics.dailyAvg)}</div>
            <div className="text-xs text-muted-foreground mt-1">Average daily cost</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-foreground">{businessAnalytics.utilization}%</div>
            <div className="text-xs text-muted-foreground mt-1">Utilization</div>
          </div>
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-4 gap-6 pt-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-base font-medium text-foreground">${formatCurrency(businessAnalytics.peakDay)}</span>
              <Info className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Peak day spend</div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span
                className={`text-base font-medium ${businessAnalytics.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {businessAnalytics.change24h >= 0 ? "+" : ""}
                {businessAnalytics.change24h}%
              </span>
              {businessAnalytics.change24h >= 0 ? (
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
                className={`text-base font-medium ${businessAnalytics.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {businessAnalytics.change7d >= 0 ? "+" : ""}
                {businessAnalytics.change7d}%
              </span>
              {businessAnalytics.change7d >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">7d change</div>
          </div>
          <div>
            <div className="text-base font-medium text-foreground">{business.accountsCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Active accounts</div>
          </div>
        </div>
      </div>

      {/* Spending Chart */}
      <div className="mt-8">
        <div className={`${layout.flexBetween} mb-4`}>
          <h2 className="text-lg font-semibold text-foreground">Spending Trends</h2>
        </div>
        <div className="h-64 w-full relative bg-card border border-border rounded-lg p-4">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
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
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-30">
                    <div className="font-medium text-foreground">${formatCurrency(point.value)}</div>
                    <div className="text-muted-foreground">{point.date}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 