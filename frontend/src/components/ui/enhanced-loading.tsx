"use client"

import { cn } from "../../lib/utils"
import { Loader2, RefreshCw, Download, Upload, CreditCard, BarChart3 } from "lucide-react"
import { Card, CardContent } from "./card"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  )
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

interface TableLoadingProps {
  rows?: number
  columns?: number
}

export function TableLoading({ rows = 5, columns = 4 }: TableLoadingProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-8 bg-muted/50 rounded animate-pulse"
              style={{ animationDelay: `${(rowIndex * columns + colIndex) * 100}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface ChartLoadingProps {
  className?: string
}

export function ChartLoading({ className }: ChartLoadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Chart area */}
      <div className="h-64 bg-muted rounded-lg animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted rounded-full animate-pulse" />
            <div className="w-16 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface CardLoadingProps {
  className?: string
}

export function CardLoading({ className }: CardLoadingProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
          </div>
          <div className="w-32 h-8 bg-muted rounded animate-pulse" />
          <div className="w-20 h-3 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}

interface ActionLoadingProps {
  action: "processing" | "uploading" | "downloading" | "refreshing" | "paying" | "analyzing"
  message?: string
  className?: string
}

export function ActionLoading({ action, message, className }: ActionLoadingProps) {
  const getIcon = () => {
    switch (action) {
      case "uploading":
        return <Upload className="h-6 w-6 animate-bounce" />
      case "downloading":
        return <Download className="h-6 w-6 animate-bounce" />
      case "refreshing":
        return <RefreshCw className="h-6 w-6 animate-spin" />
      case "paying":
        return <CreditCard className="h-6 w-6 animate-pulse" />
      case "analyzing":
        return <BarChart3 className="h-6 w-6 animate-pulse" />
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />
    }
  }

  const getDefaultMessage = () => {
    switch (action) {
      case "uploading":
        return "Uploading files..."
      case "downloading":
        return "Downloading data..."
      case "refreshing":
        return "Refreshing data..."
      case "paying":
        return "Processing payment..."
      case "analyzing":
        return "Analyzing data..."
      default:
        return "Processing..."
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="text-primary mb-4">
        {getIcon()}
      </div>
      <p className="text-sm text-muted-foreground">
        {message || getDefaultMessage()}
      </p>
    </div>
  )
}

interface FullPageLoadingProps {
  title?: string
  description?: string
}

export function FullPageLoading({ title = "Loading", description = "Please wait while we load your data..." }: FullPageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-muted rounded-full animate-spin border-t-primary" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-ping border-t-primary/20" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        </div>
      </div>
    </div>
  )
}

interface ProgressLoadingProps {
  progress: number
  message?: string
  className?: string
}

export function ProgressLoading({ progress, message = "Loading...", className }: ProgressLoadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{message}</span>
        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

// Shimmer effect for loading states
export function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-muted rounded", className)}>
      <div className="animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent h-full w-full" />
    </div>
  )
} 