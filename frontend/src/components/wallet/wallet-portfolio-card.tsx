"use client"

import { useState, useMemo } from "react"
import useSWR from 'swr'
import { useOrganizationStore } from '@/lib/stores/organization-store'
import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { formatCurrency } from "../../utils/format"
import { TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { Skeleton } from "../ui/skeleton"

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WalletPortfolioCard() {
  const { currentOrganizationId } = useOrganizationStore()
  const [timeFilter, setTimeFilter] = useState("1M")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { data, error, isLoading } = useSWR(
    currentOrganizationId ? `/api/organizations?id=${currentOrganizationId}` : null,
    fetcher
  );

  const organization = data?.organizations?.[0];
  const totalBalance = organization?.balance ?? 0;
  
  // For now, let's use a static change value until we have historical data
  const change24h = 2.5; 
  const changeAmount = (totalBalance * change24h) / 100;
  
  const chartData = useMemo(() => {
    const points = 30; // Always generate 30 points for the chart
    const baseValue = totalBalance
    
    const dataPoints = Array.from({ length: points }).map((_, i) => {
        const volatility = (Math.sin(i * 0.5) * 0.2 + Math.random() * 0.1 - 0.05);
        const value = baseValue * (1 + volatility);
        return {
            index: i,
            value: Math.max(0, value),
            time: `Day ${i + 1}`
        }
    });
    if(dataPoints.length > 0) {
      dataPoints[dataPoints.length - 1].value = totalBalance;
    }
    return dataPoints;
  }, [totalBalance]);
  
  if (isLoading) {
    return (
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-6">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-10 w-1/2 mb-4" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) return <div>Failed to load wallet data.</div>

  const timeFilters = ["1D", "1W", "1M", "3M", "1Y"]
  const isPositive = change24h >= 0

  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border-border overflow-hidden flex-1 flex flex-col">
      <CardContent className="p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">
                {organization?.name || 'Primary Wallet'}
              </h2>
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
             <Wallet className="h-8 w-8 text-muted-foreground" />
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
                d={`M 0,${100 - (chartData[0].value / Math.max(...chartData.map((p) => p.value), 1)) * 60} ${chartData
                  .map(
                    (point, i) =>
                      `L ${(i / (chartData.length - 1)) * 100},${100 - (point.value / Math.max(...chartData.map((p) => p.value), 1)) * 60}`,
                  )
                  .join(" ")} L 100,100 L 0,100 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d={`M ${chartData
                  .map(
                    (point, i) => {
                      const maxValue = Math.max(...chartData.map((p) => p.value), 1)
                      const yPos = totalBalance === 0 ? 30 : 100 - (point.value / maxValue) * 60 // Show line at 30% for $0 balance (more visible)
                      return `${(i / (chartData.length - 1)) * 100},${yPos}`
                    }
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
              const maxValue = Math.max(...chartData.map((p) => p.value), 1)
              const yPosition = totalBalance === 0 ? 30 : 100 - (point.value / maxValue) * 60
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