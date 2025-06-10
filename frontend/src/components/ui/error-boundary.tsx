"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Wifi, 
  WifiOff, 
  Server, 
  Shield,
  Clock,
  FileX,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorDisplay
          error={this.state.error}
          onRetry={this.handleRetry}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorDisplayProps {
  error?: Error
  onRetry?: () => void
  showDetails?: boolean
  className?: string
}

export function ErrorDisplay({ error, onRetry, showDetails = false, className }: ErrorDisplayProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[400px] p-4", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Bug className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-600 dark:text-red-400">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>
          
          {showDetails && error && (
            <Alert className="border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface NetworkErrorProps {
  onRetry?: () => void
  className?: string
}

export function NetworkError({ onRetry, className }: NetworkErrorProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-[300px] p-4", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-orange-600 dark:text-orange-400">Connection Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Unable to connect to our servers. Please check your internet connection and try again.
          </p>
          
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ServerErrorProps {
  statusCode?: number
  message?: string
  onRetry?: () => void
  className?: string
}

export function ServerError({ statusCode = 500, message, onRetry, className }: ServerErrorProps) {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return "The page you're looking for doesn't exist."
      case 403:
        return "You don't have permission to access this resource."
      case 500:
        return "Our servers are experiencing issues. Please try again later."
      case 503:
        return "Service is temporarily unavailable. We're working to fix this."
      default:
        return message || "An unexpected server error occurred."
    }
  }

  const getIcon = () => {
    switch (statusCode) {
      case 404:
        return <FileX className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      case 403:
        return <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
      case 503:
        return <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
      default:
        return <Server className="h-6 w-6 text-red-600 dark:text-red-400" />
    }
  }

  const getTitle = () => {
    switch (statusCode) {
      case 404:
        return "Page Not Found"
      case 403:
        return "Access Denied"
      case 503:
        return "Service Unavailable"
      default:
        return "Server Error"
    }
  }

  return (
    <div className={cn("flex items-center justify-center min-h-[400px] p-4", className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
          {statusCode && (
            <p className="text-sm text-muted-foreground">Error {statusCode}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {getErrorMessage()}
          </p>
          
          <div className="flex gap-2 justify-center">
            {onRetry && statusCode !== 404 && (
              <Button onClick={onRetry} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface InlineErrorProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: "destructive" | "warning" | "info"
  className?: string
}

export function InlineError({ 
  message, 
  onRetry, 
  onDismiss, 
  variant = "destructive", 
  className 
}: InlineErrorProps) {
  const getIcon = () => {
    switch (variant) {
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "info":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  // Map custom variants to supported Alert variants
  const alertVariant = variant === "destructive" ? "destructive" : "default"

  return (
    <Alert className={cn("", className)} variant={alertVariant}>
      {getIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex gap-2 ml-4">
          {onRetry && (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ×
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface FormErrorProps {
  errors: Record<string, string[]>
  className?: string
}

export function FormError({ errors, className }: FormErrorProps) {
  const errorEntries = Object.entries(errors).filter(([_, messages]) => messages.length > 0)
  
  if (errorEntries.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-1">
          {errorEntries.map(([field, messages]) => (
            <div key={field}>
              <strong className="capitalize">{field}:</strong>
              <ul className="list-disc list-inside ml-2">
                {messages.map((message, index) => (
                  <li key={index} className="text-sm">{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

// Hook for handling async errors with toast notifications
export function useErrorHandler() {
  const handleError = (error: Error | string, options?: {
    title?: string
    action?: {
      label: string
      onClick: () => void
    }
  }) => {
    const message = typeof error === 'string' ? error : error.message
    
    toast.error(options?.title || "Error", {
      description: message,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined
    })
  }

  const handleAsyncError = async function<T>(
    asyncFn: () => Promise<T>,
    options?: {
      title?: string
      successMessage?: string
      onError?: (error: Error) => void
    }
  ): Promise<T | null> {
    try {
      const result = await asyncFn()
      if (options?.successMessage) {
        toast.success(options.successMessage)
      }
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      handleError(errorMessage, { title: options?.title })
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage))
      return null
    }
  }

  return { handleError, handleAsyncError }
} 