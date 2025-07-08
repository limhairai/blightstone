"use client"

import { ArrowUpRight, Wallet, FolderKanban, CreditCard, Loader2 } from "lucide-react"
import { useEffect, useRef } from "react"
import { useOrganizationStore } from "@/lib/stores/organization-store"
import { formatCurrency } from "@/lib/utils"
import { useCurrentOrganization, useBusinessManagers, useAdAccounts } from "@/lib/swr-config"

export default function AccountMetrics() {
  const { currentOrganizationId } = useOrganizationStore();
  
  const { data: orgData, isLoading: isOrgLoading } = useCurrentOrganization(currentOrganizationId);
  const { data: bizData, isLoading: isBizLoading } = useBusinessManagers();
  const { data: accData, isLoading: isAccLoading } = useAdAccounts(currentOrganizationId);

  const totalAccounts = accData?.accounts?.length ?? 0;
  const totalBalance = orgData?.balance_cents ? orgData.balance_cents / 100 : 0;
  const businesses = bizData?.length ?? 0;
  // Remove hardcoded account limit - will be handled by subscription system
  
  const isLoading = isOrgLoading || isBizLoading || isAccLoading;

  const metrics = [
    {
      title: "Total accounts",
      value: totalAccounts.toString(),
      icon: CreditCard,
      trend: null,
      limit: undefined,
      percentage: undefined,
    },
    {
      title: "Businesses",
      value: businesses.toString(),
      icon: FolderKanban,
      trend: null,
      limit: undefined,
      percentage: undefined,
    },
    {
      title: "Total balance",
      value: `${formatCurrency(totalBalance)} USD`,
      icon: Wallet,
      trend: null,
      limit: undefined,
      percentage: undefined,
    },
  ]

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    const data = [
      { month: "Jan", value: 120 }, { month: "Feb", value: 150 },
      { month: "Mar", value: 180 }, { month: "Apr", value: 140 },
      { month: "May", value: 210 }, { month: "Jun", value: 250 },
      { month: "Jul", value: 190 }, { month: "Aug", value: 220 },
      { month: "Sep", value: 300 }, { month: "Oct", value: 270 },
      { month: "Nov", value: 230 }, { month: "Dec", value: 280 },
    ]

    const drawChart = () => {
      if (!ctx) return
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      ctx.clearRect(0, 0, width, height)
      const padding = { top: 20, right: 20, bottom: 30, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom
      const maxValue = Math.max(...data.map((d) => d.value))

      ctx.beginPath()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()

      const gridLines = 5
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.font = "10px sans-serif"
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i
        const value = Math.round(maxValue - (maxValue / gridLines) * i)
        ctx.beginPath()
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
        ctx.fillText(`${value}`, padding.left - 5, y)
      }

      const barWidth = (chartWidth / data.length) * 0.6
      const barSpacing = (chartWidth / data.length) * 0.4
      data.forEach((d, i) => {
        const x = padding.left + (chartWidth / data.length) * i + barSpacing / 2
        const barHeight = (d.value / maxValue) * chartHeight
        const yPos = height - padding.bottom - barHeight
        const gradient = ctx.createLinearGradient(x, yPos, x, height - padding.bottom)
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")
        ctx.fillStyle = gradient
        ctx.fillRect(x, yPos, barWidth, barHeight)
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(d.month, x + barWidth / 2, height - padding.bottom + 10)
      })
    }

    drawChart()
    window.addEventListener("resize", drawChart)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      window.removeEventListener("resize", drawChart)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-3 shadow-sm h-[88px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{metric.title}</p>
              <div className="flex items-baseline">
                <h3 className="text-xl font-bold tracking-tight">
                  {metric.value}
                  {metric.limit && (
                    <span className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400">/ {metric.limit}</span>
                  )}
                </h3>
                {metric.trend && (
                  <span className="ml-2 flex items-center text-xs font-medium text-green-600">
                    {metric.trend > 0 ? "+" : ""}
                    {metric.trend}%
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </span>
                )}
              </div>

              {metric.percentage !== undefined && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 mt-1">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <metric.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
