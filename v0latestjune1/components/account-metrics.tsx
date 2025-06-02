"use client"

import { useEffect, useRef } from "react"

export default function AccountMetrics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
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

    // Sample data
    const data = [
      { month: "Jan", value: 120 },
      { month: "Feb", value: 150 },
      { month: "Mar", value: 180 },
      { month: "Apr", value: 140 },
      { month: "May", value: 210 },
      { month: "Jun", value: 250 },
      { month: "Jul", value: 190 },
      { month: "Aug", value: 220 },
      { month: "Sep", value: 300 },
      { month: "Oct", value: 270 },
      { month: "Nov", value: 230 },
      { month: "Dec", value: 280 },
    ]

    // Draw chart
    const drawChart = () => {
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Chart dimensions
      const padding = { top: 20, right: 20, bottom: 30, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom

      // Find max value for scaling
      const maxValue = Math.max(...data.map((d) => d.value))

      // Draw axes
      ctx.beginPath()
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, height - padding.bottom)
      ctx.lineTo(width - padding.right, height - padding.bottom)
      ctx.stroke()

      // Draw horizontal grid lines
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

        ctx.fillText(`$${value}`, padding.left - 5, y)
      }

      // Draw bars
      const barWidth = (chartWidth / data.length) * 0.6
      const barSpacing = (chartWidth / data.length) * 0.4

      data.forEach((d, i) => {
        const x = padding.left + (chartWidth / data.length) * i + barSpacing / 2
        const barHeight = (d.value / maxValue) * chartHeight
        const y = height - padding.bottom - barHeight

        // Create gradient for bar
        const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom)
        gradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)

        // Draw month label
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

  return (
    <div className="w-full h-[300px]">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
