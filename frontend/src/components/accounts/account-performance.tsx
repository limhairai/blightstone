"use client"

import { useEffect, useRef, useMemo } from "react"

export default function AccountPerformance() {
  const svgRef = useRef<SVGSVGElement>(null)

  // ✅ FIXED: Memoize the expensive DOM creation
  const chartElements = useMemo(() => {
    // Sample data (in real app this would be props/state)
    const data = [
      { date: "Mon", value: 120 },
      { date: "Tue", value: 150 },
      { date: "Wed", value: 180 },
      { date: "Thu", value: 140 },
      { date: "Fri", value: 210 },
      { date: "Sat", value: 250 },
      { date: "Sun", value: 190 },
    ]

    return { data }
  }, []) // ✅ FIXED: Static chart for now, in real app would depend on data props // For now, static data - in real app would depend on actual data props

  useEffect(() => {
    if (!svgRef.current) return

    const svg = svgRef.current
    const width = svg.clientWidth
    const height = svg.clientHeight
    const { data } = chartElements

    // ✅ FIXED: Only clear DOM when actually rebuilding
    svg.innerHTML = '' // More efficient than while loop

    // Create gradient for area
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs")
    const linearGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient")
    linearGradient.setAttribute("id", "blue-gradient")
    linearGradient.setAttribute("x1", "0%")
    linearGradient.setAttribute("y1", "0%")
    linearGradient.setAttribute("x2", "0%")
    linearGradient.setAttribute("y2", "100%")

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop1.setAttribute("offset", "0%")
    stop1.setAttribute("stop-color", "rgba(59, 130, 246, 0.5)")

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop2.setAttribute("offset", "100%")
    stop2.setAttribute("stop-color", "rgba(59, 130, 246, 0)")

    linearGradient.appendChild(stop1)
    linearGradient.appendChild(stop2)
    defs.appendChild(linearGradient)
    svg.appendChild(defs)

    // Chart dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Find max value for scaling
    const maxValue = Math.max(...data.map((d) => d.value)) * 1.2

    // Create group for chart elements
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g")
    g.setAttribute("transform", `translate(${margin.left}, ${margin.top})`)
    svg.appendChild(g)

    // Draw horizontal grid lines
    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = (chartHeight / gridLines) * i
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.setAttribute("x1", "0")
      line.setAttribute("y1", y.toString())
      line.setAttribute("x2", chartWidth.toString())
      line.setAttribute("y2", y.toString())
      line.setAttribute("class", "chart-grid-line")
      g.appendChild(line)

      // Add y-axis labels
      const value = Math.round(maxValue - (maxValue / gridLines) * i)
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", "-5")
      text.setAttribute("y", y.toString())
      text.setAttribute("dy", "0.32em")
      text.setAttribute("text-anchor", "end")
      text.setAttribute("class", "chart-label")
                  text.textContent = `${value}`
      g.appendChild(text)
    }

    // Create x and y scales
    const xScale = (i: number) => (chartWidth / (data.length - 1)) * i
    const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight

    // Create line path
    let linePath = `M${xScale(0)},${yScale(data[0].value)}`
    for (let i = 1; i < data.length; i++) {
      linePath += ` L${xScale(i)},${yScale(data[i].value)}`
    }

    // Create area path
    let areaPath = `M${xScale(0)},${yScale(data[0].value)}`
    for (let i = 1; i < data.length; i++) {
      areaPath += ` L${xScale(i)},${yScale(data[i].value)}`
    }
    areaPath += ` L${xScale(data.length - 1)},${chartHeight} L${xScale(0)},${chartHeight} Z`

    // Draw area
    const area = document.createElementNS("http://www.w3.org/2000/svg", "path")
    area.setAttribute("d", areaPath)
    area.setAttribute("class", "chart-area")
    g.appendChild(area)

    // Draw line
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path")
    line.setAttribute("d", linePath)
    line.setAttribute("class", "chart-line")
    g.appendChild(line)

    // Draw dots
    data.forEach((d, i) => {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", xScale(i).toString())
      circle.setAttribute("cy", yScale(d.value).toString())
      circle.setAttribute("class", "chart-dot")
      g.appendChild(circle)
    })

    // Draw x-axis labels
    data.forEach((d, i) => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", xScale(i).toString())
      text.setAttribute("y", (chartHeight + 20).toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("class", "chart-label")
      text.textContent = d.date
      g.appendChild(text)
    })
  }, [])

  return (
    <div className="w-full h-[300px]">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  )
}
