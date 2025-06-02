"use client"

import type React from "react"

interface IsometricIllustrationProps {
  width?: number
  height?: number
  children?: React.ReactNode
  className?: string
  figureId?: string
}

export function IsometricIllustration({
  width = 400,
  height = 300,
  children,
  className = "",
  figureId,
}: IsometricIllustrationProps) {
  return (
    <div className={`relative ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id="fey-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b4a0ff" />
            <stop offset="100%" stopColor="#ffb4a0" />
          </linearGradient>
          <linearGradient id="fey-gradient-transparent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(180, 160, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(255, 180, 160, 0.3)" />
          </linearGradient>
        </defs>
        {children}
      </svg>
      {figureId && (
        <div className="absolute top-4 left-4 text-xs text-muted-foreground font-mono opacity-50">{figureId}</div>
      )}
    </div>
  )
}

// Common elements that can be reused across illustrations
export const IllustrationElements = {
  // Outline style for all elements
  outlineStyle: "stroke-white/20 stroke-[1px] fill-transparent",

  // Fill styles
  darkFill: "fill-[#0A0A0A]",
  gradientFill: "fill-url(#fey-gradient)",
  gradientTransparentFill: "fill-url(#fey-gradient-transparent)",

  // Common shapes
  Card: ({
    x,
    y,
    width,
    height,
    className = "",
  }: { x: number; y: number; width: number; height: number; className?: string }) => (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={8}
      className={`${IllustrationElements.outlineStyle} ${className}`}
    />
  ),

  Circle: ({ cx, cy, r, className = "" }: { cx: number; cy: number; r: number; className?: string }) => (
    <circle cx={cx} cy={cy} r={r} className={`${IllustrationElements.outlineStyle} ${className}`} />
  ),

  Line: ({
    x1,
    y1,
    x2,
    y2,
    className = "",
  }: { x1: number; y1: number; x2: number; y2: number; className?: string }) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} className={`stroke-white/20 ${className}`} />
  ),

  Text: ({ x, y, children, className = "" }: { x: number; y: number; children: string; className?: string }) => (
    <text x={x} y={y} className={`fill-white/60 text-[10px] font-mono ${className}`}>
      {children}
    </text>
  ),

  GradientText: ({
    x,
    y,
    children,
    className = "",
  }: { x: number; y: number; children: string; className?: string }) => (
    <text x={x} y={y} className={`fill-url(#fey-gradient) text-[10px] font-mono ${className}`}>
      {children}
    </text>
  ),
}
