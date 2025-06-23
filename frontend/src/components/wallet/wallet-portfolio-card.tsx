"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency, APP_BALANCE_DATA } from "../../lib/mock-data"
import { TrendingDown, TrendingUp } from "lucide-react"
import { useAppData } from "../../contexts/AppDataContext"

export function WalletPortfolioCard() {
  const { state } = useAppData()
  const [timeFilter, setTimeFilter] = useState("1D")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const totalBalance = state.financialData.totalBalance
  const change24h = state.financialData.growthRate || 0
  const changeAmount = (totalBalance * change24h) / 100

  // Generate chart data based on time filter and real balance data
  const chartData = useMemo(() => {
    if (timeFilter === "1M") {
      // Use actual balance data for 1M view
      return APP_BALANCE_DATA.map((item, i) => ({
        index: i,
        value: item.value,
        time: item.date,
      }))
    }

    // Generate synthetic data for other time periods
    const points = timeFilter === "1D" ? 24 : timeFilter === "1W" ? 7 : timeFilter === "3M" ? 90 : 365
    const baseValue = totalBalance
    
    return Array.from({ length: points }).map((_, i) => {
      let trend = 0
      let volatility = 0
      
      if (timeFilter === "1D") {
        // Hourly data - small fluctuations
        trend = (change24h / 100) * baseValue * (i / points)
        volatility = Math.sin(i * 0.5) * (baseValue * 0.01) + Math.cos(i * 0.3) * (baseValue * 0.005)
      } else if (timeFilter === "1W") {
        // Daily data for a week
        trend = (change24h / 100) * baseValue * (i / points) * 7
        volatility = Math.sin(i * 0.8) * (baseValue * 0.02) + Math.cos(i * 0.4) * (baseValue * 0.01)
      } else if (timeFilter === "3M") {
        // 3 month trend
        trend = (change24h / 100) * baseValue * (i / points) * 90
        volatility = Math.sin(i * 0.2) * (baseValue * 0.05) + Math.cos(i * 0.1) * (baseValue * 0.03)
      } else {
        // 1 year trend
        trend = (change24h / 100) * baseValue * (i / points) * 365
        volatility = Math.sin(i * 0.1) * (baseValue * 0.08) + Math.cos(i * 0.05) * (baseValue * 0.05)
      }
      
      const value = Math.max(baseValue * 0.5, baseValue - trend + volatility)
      
      return {
        index: i,
        value,
        time: timeFilter === "1D" 
          ? `${String(i).padStart(2, "0")}:00` 
          : timeFilter === "1W" 
            ? `Day ${i + 1}` 
            : `${i + 1}`,
      }
    })
  }, [timeFilter, totalBalance, change24h])

  const timeFilters = ["1D", "1W", "1M", "3M", "1Y"]
  const isPositive = change24h >= 0

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border overflow-hidden flex-1 flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">Primary Wallet</h2>
              <span className="text-xs text-[#c4b5fd] bg-[#c4b5fd]/10 px-2 py-1 rounded">
                Current account
              </span>
            </div>
            <div className="text-3xl font-bold text-foreground">${formatCurrency(totalBalance)}</div>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                ${Math.abs(changeAmount).toFixed(2)} ({isPositive ? '+' : ''}{change24h.toFixed(1)}%) this month
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div>${formatCurrency(totalBalance)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative flex-1 mb-4 min-h-[200px]">
          {/* Chart Area */}
          <div className="absolute inset-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gradient Definitions */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} />
                  <stop offset="100%" stopColor={isPositive ? "#059669" : "#f97316"} />
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
                      hoveredIndex === i 
                        ? `${isPositive ? 'bg-green-400' : 'bg-red-400'} scale-150 shadow-lg opacity-100` 
                        : "opacity-0"
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
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>24:00</span>
              </>
            ) : timeFilter === "1M" ? (
              chartData.slice(0, 5).map((point, i) => (
                <span key={i}>{point.time}</span>
              ))
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
                  ? "bg-accent text-accent-foreground hover:bg-accent/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
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