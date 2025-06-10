"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/utils/format"
import { BarChart3, TrendingUp, Calendar, Target } from "lucide-react"

interface SpendingData {
  period: string
  techflow: number
  digitalmarketing: number
  startuphub: number
  total: number
}

export function WalletSpendingTrends() {
  const [timeframe, setTimeframe] = useState("7d")
  const [view, setView] = useState("spending") // spending | budget
  const [hoveredSpendIndex, setHoveredSpendIndex] = useState<number | null>(null)

  const spendingData: SpendingData[] = [
    { period: "Mon", techflow: 120, digitalmarketing: 85, startuphub: 45, total: 250 },
    { period: "Tue", techflow: 180, digitalmarketing: 120, startuphub: 60, total: 360 },
    { period: "Wed", techflow: 150, digitalmarketing: 95, startuphub: 80, total: 325 },
    { period: "Thu", techflow: 220, digitalmarketing: 140, startuphub: 55, total: 415 },
    { period: "Fri", techflow: 190, digitalmarketing: 110, startuphub: 70, total: 370 },
    { period: "Sat", techflow: 80, digitalmarketing: 45, startuphub: 25, total: 150 },
    { period: "Sun", techflow: 100, digitalmarketing: 60, startuphub: 30, total: 190 },
  ]

  const totalSpent = spendingData.reduce((sum, day) => sum + day.total, 0)
  const avgDaily = totalSpent / spendingData.length
  const highestDay = Math.max(...spendingData.map((d) => d.total))
  const projectedMonthly = avgDaily * 30

  const businessColors = {
    techflow: "#c4b5fd",
    digitalmarketing: "#ffc4b5",
    startuphub: "#a7f3d0",
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#c4b5fd]" />
            Spending Trends & Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32 h-8 bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="7d" className="text-popover-foreground hover:bg-accent">
                  Last 7 days
                </SelectItem>
                <SelectItem value="30d" className="text-popover-foreground hover:bg-accent">
                  Last 30 days
                </SelectItem>
                <SelectItem value="90d" className="text-popover-foreground hover:bg-accent">
                  Last 90 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-3">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Total Spent</div>
                <div className="text-lg font-bold text-foreground">${formatCurrency(totalSpent)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Daily Average</div>
                <div className="text-lg font-bold text-foreground">${formatCurrency(avgDaily)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Peak Day</div>
                <div className="text-lg font-bold text-foreground">${formatCurrency(highestDay)}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-xs text-muted-foreground">Projected Monthly</div>
                <div className="text-lg font-bold text-emerald-400">${formatCurrency(projectedMonthly)}</div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">Daily Spending Breakdown</h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: businessColors.techflow }}></div>
                    <span className="text-muted-foreground">TechFlow</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: businessColors.digitalmarketing }}
                    ></div>
                    <span className="text-muted-foreground">Digital Marketing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: businessColors.startuphub }}></div>
                    <span className="text-muted-foreground">StartupHub</span>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Chart */}
              <div className="h-48 w-full relative">
                <div className="absolute inset-0 bottom-5">
                  {/* SVG Chart */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 700 160"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Gradient definitions */}
                    <defs>
                      <linearGradient id="techflowBar" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c4b5fd" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                      <linearGradient id="digitalmarketingBar" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffc4b5" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="startuphubBar" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a7f3d0" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Stacked bars */}
                    {spendingData.map((day, i) => {
                      const x = (i * 700) / spendingData.length + 50
                      const barWidth = 60
                      const maxHeight = Math.max(...spendingData.map((d) => d.total))

                      // Calculate heights for stacked bars
                      const techflowHeight = (day.techflow / maxHeight) * 120
                      const digitalmarketingHeight = (day.digitalmarketing / maxHeight) * 120
                      const startuphubHeight = (day.startuphub / maxHeight) * 120

                      const techflowY = 160 - techflowHeight
                      const digitalmarketingY = techflowY - digitalmarketingHeight
                      const startuphubY = digitalmarketingY - startuphubHeight

                      return (
                        <g key={i}>
                          {/* TechFlow bar */}
                          <rect
                            x={x - barWidth / 2}
                            y={techflowY}
                            width={barWidth}
                            height={techflowHeight}
                            fill="url(#techflowBar)"
                            rx="2"
                            className="transition-all duration-300"
                          />
                          {/* Digital Marketing bar */}
                          <rect
                            x={x - barWidth / 2}
                            y={digitalmarketingY}
                            width={barWidth}
                            height={digitalmarketingHeight}
                            fill="url(#digitalmarketingBar)"
                            rx="2"
                            className="transition-all duration-300"
                          />
                          {/* StartupHub bar */}
                          <rect
                            x={x - barWidth / 2}
                            y={startuphubY}
                            width={barWidth}
                            height={startuphubHeight}
                            fill="url(#startuphubBar)"
                            rx="2"
                            className="transition-all duration-300"
                          />
                        </g>
                      )
                    })}
                  </svg>

                  {/* Interactive hover areas */}
                  {spendingData.map((day, i) => (
                    <div
                      key={i}
                      className="absolute w-20 h-full cursor-pointer z-20 flex items-end justify-center"
                      style={{
                        left: `${(i / spendingData.length) * 100}%`,
                      }}
                      onMouseEnter={() => setHoveredSpendIndex(i)}
                      onMouseLeave={() => setHoveredSpendIndex(null)}
                    >
                      {hoveredSpendIndex === i && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-background border rounded px-3 py-2 text-xs whitespace-nowrap shadow-lg z-30">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {day.period} - ${formatCurrency(day.total)}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#c4b5fd]"></div>
                                <span className="text-muted-foreground">TechFlow: ${day.techflow}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#ffc4b5]"></div>
                                <span className="text-muted-foreground">Digital: ${day.digitalmarketing}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#a7f3d0]"></div>
                                <span className="text-muted-foreground">StartupHub: ${day.startuphub}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom axis line */}
                <div className="absolute bottom-5 left-0 right-0 h-[1px] w-full bg-border z-5"></div>

                {/* Day labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-8 z-5">
                  {spendingData.map((day) => (
                    <span key={day.period}>{day.period}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights Panel */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Insights</h4>

            <div className="space-y-3">
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Trending Up</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  TechFlow spending increased 22% this week, indicating strong campaign performance.
                </p>
              </div>

              <div className="p-3 bg-yellow-950/20 border border-yellow-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-medium text-yellow-400">Budget Alert</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digital Marketing Co is at 82% of monthly budget with 8 days remaining.
                </p>
              </div>

              <div className="p-3 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-blue-400">Pattern</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Weekend spending drops by 60% on average. Consider pausing campaigns.
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full border-border text-foreground hover:bg-accent">
              View Detailed Analytics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
