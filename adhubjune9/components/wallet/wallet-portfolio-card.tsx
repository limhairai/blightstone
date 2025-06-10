"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/format"
import { TrendingDown, TrendingUp } from "lucide-react"

export function WalletPortfolioCard() {
  const [timeFilter, setTimeFilter] = useState("1D")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalBalance = 5750.0
  const change24h = -3.2
  const changeAmount = -185.0

  // Generate chart data based on time filter
  const chartData = useMemo(() => {
    const points = timeFilter === "1D" ? 24 : timeFilter === "1W" ? 7 : timeFilter === "1M" ? 30 : 90
    return Array.from({ length: points }).map((_, i) => {
      const baseValue = 5750
      const trend = timeFilter === "1D" ? -2 * i : timeFilter === "1W" ? -15 * i : -8 * i
      const volatility = Math.sin(i * 0.5) * 150 + Math.cos(i * 0.3) * 100
      return {
        index: i,
        value: Math.max(5000, baseValue + trend + volatility),
        time:
          timeFilter === "1D" ? `${String(i).padStart(2, "0")}:00` : timeFilter === "1W" ? `Day ${i + 1}` : `${i + 1}`,
      }
    })
  }, [timeFilter])

  const timeFilters = ["1D", "1W", "1M", "3M", "1Y"]

  return (
    <Card className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border-[#222222] overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-white">Primary</h2>
              <span className="text-xs text-[#b4a0ff] bg-[#b4a0ff]/10 px-2 py-1 rounded">Current account</span>
            </div>
            <div className="text-3xl font-bold text-white">${formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-1 mt-1">
              {change24h < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-400" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              )}
              <span className={`text-sm ${change24h < 0 ? "text-red-400" : "text-emerald-400"}`}>
                ${Math.abs(changeAmount).toFixed(2)} ({change24h > 0 ? "+" : ""}
                {change24h}%) about 24 hours
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>May 22</div>
            <div>${formatCurrency(totalBalance)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-[200px] mb-4">
          {/* Chart Area */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff6b6b" />
                  <stop offset="100%" stopColor="#ff8e53" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path
                d={`M 0,${100 - (chartData[0].value / Math.max(...chartData.map((p) => p.value))) * 60} ${chartData
                  .map(
                    (point, i) =>
                      `L ${(i / (chartData.length - 1)) * 100},${100 - (point.value / Math.max(...chartData.map((p) => p.value))) * 60}`,
                  )
                  .join(" ")} L 100,100 L 0,100 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d={`M ${chartData
                  .map(
                    (point, i) =>
                      `${(i / (chartData.length - 1)) * 100},${100 - (point.value / Math.max(...chartData.map((p) => p.value))) * 60}`,
                  )
                  .join(" L ")}`}
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Interactive Hover Points */}
            {chartData.map((point, i) => {
              const yPosition = 100 - (point.value / Math.max(...chartData.map((p) => p.value))) * 60
              return (
                <div
                  key={i}
                  className="absolute w-8 h-8 -translate-x-4 -translate-y-4 cursor-pointer z-10 flex items-center justify-center"
                  style={{
                    left: `${(i / (chartData.length - 1)) * 100}%`,
                    top: `${yPosition}%`,
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      hoveredIndex === i ? "bg-[#ff6b6b] scale-150 shadow-lg opacity-100" : "opacity-0"
                    }`}
                  />
                  {hoveredIndex === i && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap shadow-lg z-30">
                      <div className="font-medium">${formatCurrency(point.value)}</div>
                      <div className="text-muted-foreground">{point.time}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
            {timeFilter === "1D" ? (
              <>
                <span>18:00</span>
                <span>21:00</span>
                <span>3</span>
                <span>03:00</span>
                <span>06:00</span>
                <span>09:00</span>
                <span>12:00</span>
                <span>15:00</span>
              </>
            ) : (
              <>
                <span>Start</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>End</span>
              </>
            )}
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex gap-1">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              variant={timeFilter === filter ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeFilter(filter)}
              className={`h-8 px-3 text-xs ${
                timeFilter === filter
                  ? "bg-[#333333] text-white hover:bg-[#444444]"
                  : "text-muted-foreground hover:text-white hover:bg-[#222222]"
              }`}
            >
              {filter}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
