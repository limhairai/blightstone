"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowUpRight, ArrowDownRight, ExternalLink, Info } from "lucide-react"

interface StockDetailProps {
  symbol: string
  name: string
  price: string
  change: string
  changePercent: string
  isPositive: boolean
  news?: {
    title: string
    content: string
  }
  metrics: {
    label: string
    value: string
  }[]
}

export function StockDetail({
  symbol,
  name,
  price,
  change,
  changePercent,
  isPositive,
  news,
  metrics,
}: StockDetailProps) {
  const [activeTab, setActiveTab] = useState("Chart")
  const tabs = ["Chart", "Statistics", "Holdings", "Returns", "Composition", "Flows", "Dividends"]
  const timeframes = ["1D", "1W", "1M", "3M", "YTD", "1Y", "All"]
  const [timeframe, setTimeframe] = useState("All")
  const chartRef = useRef<HTMLCanvasElement>(null)

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

    // Generate random data points that trend upward
    const points = []
    let y = height * 0.7
    for (let x = 0; x < width; x += 5) {
      y = y + (Math.random() * 8 - 4)
      // Keep within bounds
      y = Math.max(height * 0.3, Math.min(height * 0.9, y))
      points.push({ x, y })
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
    ctx.lineWidth = 1

    // Horizontal grid lines
    for (let i = 0; i < 5; i++) {
      const y = (height / 5) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw chart line
    ctx.strokeStyle = isPositive ? "rgba(0, 255, 127, 0.8)" : "rgba(255, 69, 58, 0.8)"
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

    // Draw area under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    if (isPositive) {
      gradient.addColorStop(0, "rgba(0, 255, 127, 0.2)")
      gradient.addColorStop(1, "rgba(0, 255, 127, 0)")
    } else {
      gradient.addColorStop(0, "rgba(255, 69, 58, 0.2)")
      gradient.addColorStop(1, "rgba(255, 69, 58, 0)")
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y)
    })
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.lineTo(points[0].x, height)
    ctx.closePath()
    ctx.fill()
  }, [isPositive, timeframe])

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-[#1E1E1E] rounded-md flex items-center justify-center font-bold">
            {symbol.charAt(0)}
          </div>
          <div>
            <div className="text-sm text-[#8A8A8D]">
              {symbol} · {name}
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-medium">{price}</span>
              <span className={`ml-2 flex items-center ${isPositive ? "text-[#00FF7F]" : "text-[#FF453A]"}`}>
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 mr-0.5" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-0.5" />
                )}
                {change} ({changePercent})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[#2C2C2E]">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`rounded-none border-b-2 px-4 h-10 text-sm ${
                activeTab === tab
                  ? "border-[#0A84FF] text-white"
                  : "border-transparent text-[#8A8A8D] hover:text-white hover:border-[#3A3A3C]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] bg-[#1C1C1E] rounded-md p-4 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <div className="flex items-center gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`px-2 py-1 text-xs rounded ${
                  timeframe === tf ? "bg-[#2C2C2E] text-white" : "text-[#8A8A8D]"
                }`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <canvas ref={chartRef} className="w-full h-[220px]"></canvas>
      </div>

      {news && (
        <div className="mt-4 bg-[#1C1C1E] rounded-md p-4">
          <p className="text-sm mb-4">{news.content}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button className="text-xs text-[#8A8A8D] hover:text-white">Insight</button>
              <button className="text-xs text-white">About</button>
            </div>
            <div className="flex gap-2">
              <button className="h-7 w-7 rounded-full border border-[#3A3A3C] flex items-center justify-center">
                <ExternalLink className="h-3.5 w-3.5 text-[#8A8A8D]" />
              </button>
              <button className="h-7 w-7 rounded-full border border-[#3A3A3C] flex items-center justify-center">
                <Info className="h-3.5 w-3.5 text-[#8A8A8D]" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-3 text-[#8A8A8D]">Statistics and KPIs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-[#1C1C1E] rounded-md p-3">
              <div className="text-xs text-[#8A8A8D] mb-1">{metric.label}</div>
              <div className="font-medium">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
