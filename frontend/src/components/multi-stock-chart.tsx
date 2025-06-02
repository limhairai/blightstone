"use client"

import { useState, useEffect, useRef } from "react"
import { Filter, Plus } from "lucide-react"

interface StockData {
  symbol: string
  name: string
  color: string
  minimum: string
  average: string
  maximum: string
  change: string
  isPositive: boolean
}

interface MultiStockChartProps {
  stocks: StockData[]
}

export function MultiStockChart({ stocks }: MultiStockChartProps) {
  const [timeframe, setTimeframe] = useState("All")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const timeframes = ["1D", "1W", "1M", "3M", "YTD", "1Y", "All"]

  useEffect(() => {
    if (!chartRef.current) return
    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    chartRef.current.width = chartRef.current.offsetWidth * dpr
    chartRef.current.height = chartRef.current.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    // Draw chart
    const width = chartRef.current.offsetWidth
    const height = chartRef.current.offsetHeight

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = (width / 5) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Draw stock lines
    stocks.forEach((stock, stockIndex) => {
      // Generate random data points with different patterns for each stock
      const points = []
      let y = height * (0.5 + stockIndex * 0.1)

      for (let x = 0; x < width; x += 5) {
        // Different patterns for different stocks
        if (stockIndex === 0) {
          y = y + (Math.random() * 6 - 3) // More volatile
        } else if (stockIndex === 1) {
          y = y + (Math.random() * 4 - 2) // Medium volatility
        } else {
          y = y + (Math.random() * 2 - 1) // Less volatile
        }

        // Keep within bounds
        y = Math.max(height * 0.1, Math.min(height * 0.9, y))
        points.push({ x, y })
      }

      // Draw line
      ctx.strokeStyle = stock.color
      ctx.lineWidth = 2
      ctx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    })

    // Add date labels at bottom
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "center"

    const dates = ["Sep 1, 2023", "Nov 13, 2023", "Jan 24, 2024", "Apr 8, 2024", "Jun 20, 2024", "Sep 1, 2024"]
    dates.forEach((date, i) => {
      const x = (width / 5) * i
      ctx.fillText(date, x, height - 5)
    })
  }, [stocks, timeframe])

  return (
    <div className="bg-[#1C1C1E] rounded-md overflow-hidden">
      <div className="p-4 border-b border-[#2C2C2E]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Graph selection</h2>
          <div className="flex items-center gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`h-7 px-2 text-xs ${
                  timeframe === tf ? "bg-[#2C2C2E] text-white rounded" : "text-[#8A8A8D]"
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
            <button className="h-7 w-7 flex items-center justify-center text-[#8A8A8D]">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="h-[300px] mb-6">
          <canvas ref={chartRef} className="w-full h-full"></canvas>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-[#8A8A8D] px-2">
            <div className="w-1/5">Symbol</div>
            <div className="w-1/5 text-center">Minimum</div>
            <div className="w-1/5 text-center">Average</div>
            <div className="w-1/5 text-center">Maximum</div>
            <div className="w-1/5 text-center">1Y Change</div>
          </div>

          {stocks.map((stock) => (
            <div key={stock.symbol} className="flex items-center p-2 rounded-md hover:bg-[#2C2C2E]">
              <div className="w-1/5 flex items-center gap-2">
                <div className="h-3 w-3" style={{ backgroundColor: stock.color }}></div>
                <span className="font-medium text-white">{stock.symbol}</span>
              </div>
              <div className="w-1/5 text-center font-mono text-sm text-white">{stock.minimum}</div>
              <div className="w-1/5 text-center font-mono text-sm text-white">{stock.average}</div>
              <div className="w-1/5 text-center font-mono text-sm text-white">{stock.maximum}</div>
              <div className="w-1/5 text-center flex items-center justify-center">
                <span className={`flex items-center text-xs ${stock.isPositive ? "text-[#00FF7F]" : "text-[#FF453A]"}`}>
                  {stock.isPositive ? "+" : "-"}
                  {stock.change}
                </span>
              </div>
            </div>
          ))}

          <button className="w-full text-[#8A8A8D] border border-dashed border-[#3A3A3C] rounded-md h-10 flex items-center justify-center">
            <Plus className="h-4 w-4 mr-2" />
            Compare graphs
          </button>
        </div>
      </div>
    </div>
  )
}
