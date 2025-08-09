import * as React from "react"
import { Skeleton } from "./skeleton"
import { Button } from "./button"
import { AlertCircle, RefreshCw, LucideIcon } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "Please try again later.",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="rounded-full p-3 bg-muted dark:bg-muted/20">
        <AlertCircle className="h-6 w-6 text-muted-foreground dark:text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  type?: "first-time" | "search" | "filtered"
}

export function EmptyState({ 
  icon: Icon = AlertCircle,
  title = "No data available", 
  description = "There's nothing to show here yet.",
  type = "first-time"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="rounded-full p-3 bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
} 