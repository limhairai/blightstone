"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LineChartProps {
  title: string
  description?: string
  data: number[]
  labels: string[]
  height?: number
  color?: string
  className?: string
}

export function LineChart({
  title,
  description,
  data,
  labels,
  height = 300,
  color = "#b4a0ff",
  className,
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const chartHeight = height - 40 // Leave space for labels
    const padding = { top: 20, right: 20, bottom: 20, left: 40 }
    const chartWidth = width - padding.left - padding.right

    // Find min and max values
    const maxValue = Math.max(...data) * 1.1 // Add 10% padding
    const minValue = Math.min(0, ...data) // Start from 0 or lower if there are negative values

    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const numGridLines = 5
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding.top + (chartHeight * i) / numGridLines
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()

      // Draw y-axis labels
      const value = maxValue - (i * (maxValue - minValue)) / numGridLines
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(0), padding.left - 5, y + 3)
    }

    // Draw line chart
    if (data.length > 1) {
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()

      // Calculate points
      const points = data.map((value, index) => {
        const x = padding.left + (index * chartWidth) / (data.length - 1)
        const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
        return { x, y }
      })

      // Draw line
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()

      // Draw area under the line
      ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight)
      ctx.lineTo(points[0].x, padding.top + chartHeight)
      ctx.closePath()
      ctx.fillStyle = `${color}20` // 20% opacity
      ctx.fill()

      // Draw points
      ctx.fillStyle = color
      points.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw x-axis labels
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      points.forEach((point, index) => {
        if (index % Math.ceil(labels.length / 7) === 0 || index === labels.length - 1) {
          ctx.fillText(labels[index], point.x, padding.top + chartHeight + 15)
        }
      })
    }
  }, [data, labels, height, color])

  return (
    <Card className={`airwallex-card ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} width={800} height={height} className="w-full" />
      </CardContent>
    </Card>
  )
} 