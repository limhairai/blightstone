"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/format"
import { PieChart, MoreHorizontal, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BusinessAllocation {
  id: string
  name: string
  allocated: number
  spent: number
  remaining: number
  accounts: number
  color: string
  change: number
  status: "active" | "warning" | "critical"
}

export function WalletAllocation() {
  const totalWallet = 5750.0

  const businessAllocations: BusinessAllocation[] = [
    {
      id: "1",
      name: "TechFlow Solutions",
      allocated: 2800.0,
      spent: 1850.0,
      remaining: 950.0,
      accounts: 2,
      color: "#c4b5fd",
      change: 15.2,
      status: "active",
    },
    {
      id: "2",
      name: "Digital Marketing Co",
      allocated: 1200.0,
      spent: 980.0,
      remaining: 220.0,
      accounts: 2,
      color: "#ffc4b5",
      change: -8.5,
      status: "warning",
    },
    {
      id: "3",
      name: "StartupHub Inc",
      allocated: 750.0,
      spent: 680.0,
      remaining: 70.0,
      accounts: 1,
      color: "#a7f3d0",
      change: 22.1,
      status: "critical",
    },
  ]

  const totalAllocated = businessAllocations.reduce((sum, business) => sum + business.allocated, 0)
  const unallocated = totalWallet - totalAllocated

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-emerald-400"
      case "warning":
        return "text-yellow-400"
      case "critical":
        return "text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-950/50 text-emerald-400 border-emerald-700 text-xs">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-950/50 text-yellow-400 border-yellow-700 text-xs">Low Funds</Badge>
      case "critical":
        return <Badge className="bg-red-950/50 text-red-400 border-red-700 text-xs">Critical</Badge>
      default:
        return null
    }
  }

  // Simple pie chart calculation
  const pieData = [
    ...businessAllocations.map((business) => ({
      ...business,
      percentage: (business.allocated / totalWallet) * 100,
    })),
    {
      id: "unallocated",
      name: "Unallocated",
      allocated: unallocated,
      percentage: (unallocated / totalWallet) * 100,
      color: "#6b7280",
    },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#c4b5fd]" />
            Fund Allocation by Business
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* SVG Pie Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="techflowPie" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                  <linearGradient id="digitalmarketingPie" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ffc4b5" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <linearGradient id="startuphubPie" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a7f3d0" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="unallocatedPie" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6b7280" />
                    <stop offset="100%" stopColor="#4b5563" />
                  </linearGradient>
                </defs>

                {/* Background circle */}
                <circle cx="50" cy="50" r="35" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3" />

                {/* Pie segments */}
                {(() => {
                  let cumulativePercentage = 0
                  return pieData.map((segment, index) => {
                    const startAngle = cumulativePercentage * 3.6 // Convert to degrees
                    const endAngle = (cumulativePercentage + segment.percentage) * 3.6
                    cumulativePercentage += segment.percentage

                    // Calculate path for pie segment
                    const startAngleRad = (startAngle * Math.PI) / 180
                    const endAngleRad = (endAngle * Math.PI) / 180

                    const largeArcFlag = segment.percentage > 50 ? 1 : 0
                    const x1 = 50 + 35 * Math.cos(startAngleRad)
                    const y1 = 50 + 35 * Math.sin(startAngleRad)
                    const x2 = 50 + 35 * Math.cos(endAngleRad)
                    const y2 = 50 + 35 * Math.sin(endAngleRad)

                    const pathData = [`M 50 50`, `L ${x1} ${y1}`, `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(
                      " ",
                    )

                    const gradientId =
                      segment.id === "unallocated"
                        ? "unallocatedPie"
                        : segment.id === "1"
                          ? "techflowPie"
                          : segment.id === "2"
                            ? "digitalmarketingPie"
                            : "startuphubPie"

                    return (
                      <path
                        key={segment.id}
                        d={pathData}
                        fill={`url(#${gradientId})`}
                        stroke="#1f2937"
                        strokeWidth="1"
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    )
                  })
                })()}
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-foreground">${formatCurrency(totalWallet)}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>
          </div>

          {/* Business List */}
          <div className="space-y-3">
            {businessAllocations.map((business) => (
              <div
                key={business.id}
                className="p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: business.color }}></div>
                    <span className="font-medium text-foreground text-sm">{business.name}</span>
                    {getStatusBadge(business.status)}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-muted-foreground">Allocated</div>
                    <div className="font-medium text-foreground">${formatCurrency(business.allocated)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Remaining</div>
                    <div className={cn("font-medium", getStatusColor(business.status))}>
                      ${formatCurrency(business.remaining)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Accounts</div>
                    <div className="font-medium text-foreground">{business.accounts}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">30d Change</div>
                    <div
                      className={cn(
                        "font-medium flex items-center gap-1",
                        business.change > 0 ? "text-emerald-400" : "text-red-400",
                      )}
                    >
                      {business.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(business.change)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilization</span>
                    <span>{Math.round((business.spent / business.allocated) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(business.spent / business.allocated) * 100}%`,
                        backgroundColor: business.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Unallocated */}
            {unallocated > 0 && (
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="font-medium text-foreground text-sm">Unallocated</span>
                  <Badge variant="outline" className="text-xs">
                    Available
                  </Badge>
                </div>
                <div className="text-sm font-medium text-foreground">${formatCurrency(unallocated)}</div>
                <div className="text-xs text-muted-foreground">Ready for distribution</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
