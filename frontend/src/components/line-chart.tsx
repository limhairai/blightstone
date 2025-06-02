"use client"

import { useEffect, useRef } from "react"

interface LineChartProps {
  data: { date: string; value: number }[]
  height?: number
  showGrid?: boolean
  showLabels?: boolean
  lineColor?: string
  areaColor?: string
}

export function LineChart({
  data,
  height = 200,
  showGrid = true,
  showLabels = true,
  lineColor = "#fff",
  areaColor = "rgba(255, 255, 255, 0.1)",
}: LineChartProps) {
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

      // Find min/max values for scaling
      const maxValue = Math.max(...data.map((d) => d.value))
      const minValue = Math.min(...data.map((d) => d.value))
      const valueRange = maxValue - minValue

      // Draw grid
      if (showGrid) {
        const gridLines = 5
        ctx.textAlign = "right"
        ctx.textBaseline = "middle"
        ctx.font = "10px sans-serif"
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"

        for (let i = 0; i <= gridLines; i++) {
          const y = padding.top + (chartHeight / gridLines) * i
          const value = Math.round(maxValue - (valueRange / gridLines) * i)

          ctx.beginPath()
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"
          ctx.moveTo(padding.left, y)
          ctx.lineTo(width - padding.right, y)
          ctx.stroke()

          if (showLabels) {
            ctx.fillText(`$${value}`, padding.left - 5, y)
          }
        }
      }

      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2

      data.forEach((d, i) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * i
        const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw area
      ctx.beginPath()
      ctx.fillStyle = areaColor

      data.forEach((d, i) => {
        const x = padding.left + (chartWidth / (data.length - 1)) * i
        const y = padding.top + chartHeight - ((d.value - minValue) / valueRange) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
      ctx.lineTo(padding.left, padding.top + chartHeight)
      ctx.closePath()
      ctx.fill()

      // Draw x-axis labels
      if (showLabels) {
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"

        // Only show a subset of labels to avoid overcrowding
        const labelStep = Math.ceil(data.length / 5)
        data.forEach((d, i) => {
          if (i % labelStep === 0 || i === data.length - 1) {
            const x = padding.left + (chartWidth / (data.length - 1)) * i
            ctx.fillText(d.date, x, padding.top + chartHeight + 10)
          }
        })
      }
    }

    drawChart()
    window.addEventListener("resize", drawChart)

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      window.removeEventListener("resize", drawChart)
    }
  }, [data, height, showGrid, showLabels, lineColor, areaColor])

  return <canvas ref={canvasRef} height={height} className="w-full" />
}
