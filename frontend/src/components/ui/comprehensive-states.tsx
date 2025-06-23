/**
 * Comprehensive UI States System
 * Provides consistent error, empty, loading, and validation states across the app
 */

import React from 'react'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Skeleton } from './skeleton'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2, 
  RefreshCw, 
  WifiOff,
  Database,
  Search,
  FileX,
  Users,
  Building2,
  CreditCard,
  Activity,
  Settings,
  Upload,
  Download,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// ERROR STATES
// ============================================================================

interface ErrorStateProps {
  title?: string
  message?: string
  type?: 'network' | 'permission' | 'validation' | 'server' | 'not-found' | 'generic'
  retry?: () => void
  className?: string
}

export function ErrorState({ 
  title, 
  message, 
  type = 'generic', 
  retry, 
  className 
}: ErrorStateProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          defaultTitle: 'Connection Error',
          defaultMessage: 'Please check your internet connection and try again.'
        }
      case 'permission':
        return {
          icon: AlertCircle,
          defaultTitle: 'Access Denied',
          defaultMessage: 'You don\'t have permission to access this resource.'
        }
      case 'validation':
        return {
          icon: AlertTriangle,
          defaultTitle: 'Validation Error',
          defaultMessage: 'Please check your input and try again.'
        }
      case 'server':
        return {
          icon: Database,
          defaultTitle: 'Server Error',
          defaultMessage: 'Something went wrong on our end. Please try again later.'
        }
      case 'not-found':
        return {
          icon: FileX,
          defaultTitle: 'Not Found',
          defaultMessage: 'The requested resource could not be found.'
        }
      default:
        return {
          icon: XCircle,
          defaultTitle: 'Something went wrong',
          defaultMessage: 'An unexpected error occurred. Please try again.'
        }
    }
  }

  const config = getErrorConfig()
  const Icon = config.icon

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <Icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title || config.defaultTitle}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {message || config.defaultMessage}
      </p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  type?: 'no-data' | 'search' | 'filter' | 'first-time'
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  type = 'no-data',
  className 
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return Search
      case 'filter':
        return Settings
      case 'first-time':
        return Database
      default:
        return FileX
    }
  }

  const Icon = icon || getDefaultIcon()

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="rounded-full bg-muted/30 p-4 mb-6">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button 
          variant={action.variant || 'outline'} 
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// LOADING STATES
// ============================================================================

interface LoadingStateProps {
  message?: string
  type?: 'spinner' | 'skeleton' | 'action'
  action?: 'uploading' | 'downloading' | 'processing' | 'saving' | 'loading'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function LoadingState({ 
  message, 
  type = 'spinner', 
  action = 'loading',
  size = 'medium',
  className 
}: LoadingStateProps) {
  const getIcon = () => {
    switch (action) {
      case 'uploading':
        return <Upload className={`animate-bounce ${getSizeClass()}`} />
      case 'downloading':
        return <Download className={`animate-bounce ${getSizeClass()}`} />
      case 'processing':
        return <Activity className={`animate-pulse ${getSizeClass()}`} />
      case 'saving':
        return <Database className={`animate-pulse ${getSizeClass()}`} />
      default:
        return <Loader2 className={`animate-spin ${getSizeClass()}`} />
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'h-4 w-4'
      case 'large':
        return 'h-8 w-8'
      default:
        return 'h-6 w-6'
    }
  }

  const getDefaultMessage = () => {
    switch (action) {
      case 'uploading':
        return 'Uploading...'
      case 'downloading':
        return 'Downloading...'
      case 'processing':
        return 'Processing...'
      case 'saving':
        return 'Saving...'
      default:
        return 'Loading...'
    }
  }

  if (type === 'skeleton') {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <div className="text-primary mb-4">
        {getIcon()}
      </div>
      <p className="text-sm text-muted-foreground">
        {message || getDefaultMessage()}
      </p>
    </div>
  )
}

// ============================================================================
// VALIDATION STATES
// ============================================================================

interface ValidationMessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  className?: string
}

export function ValidationMessage({ type, message, className }: ValidationMessageProps) {
  const getConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: XCircle,
          className: 'text-destructive'
        }
      case 'success':
        return {
          icon: CheckCircle2,
          className: 'text-green-600'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'text-yellow-600'
        }
      case 'info':
        return {
          icon: Info,
          className: 'text-blue-600'
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-2 text-sm", config.className, className)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ============================================================================
// FORM FIELD STATES
// ============================================================================

interface FormFieldStateProps {
  children: React.ReactNode
  error?: string
  success?: string
  warning?: string
  info?: string
  required?: boolean
  className?: string
}

export function FormFieldState({ 
  children, 
  error, 
  success, 
  warning, 
  info, 
  required,
  className 
}: FormFieldStateProps) {
  const getStateMessage = () => {
    if (error) return { type: 'error' as const, message: error }
    if (success) return { type: 'success' as const, message: success }
    if (warning) return { type: 'warning' as const, message: warning }
    if (info) return { type: 'info' as const, message: info }
    return null
  }

  const stateMessage = getStateMessage()

  return (
    <div className={cn("space-y-2", className)}>
      {children}
      {stateMessage && (
        <ValidationMessage 
          type={stateMessage.type} 
          message={stateMessage.message} 
        />
      )}
    </div>
  )
}

// ============================================================================
// SUCCESS STATES
// ============================================================================

interface SuccessStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  autoHide?: {
    duration: number
    onHide: () => void
  }
  className?: string
}

export function SuccessState({ 
  title, 
  description, 
  action, 
  autoHide,
  className 
}: SuccessStateProps) {
  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        autoHide.onHide()
      }, autoHide.duration)
      return () => clearTimeout(timer)
    }
  }, [autoHide])

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="rounded-full bg-green-100 p-4 mb-6">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ============================================================================
// SPECIALIZED EMPTY STATES
// ============================================================================

export function NoAccountsFound({ onCreateAccount }: { onCreateAccount?: () => void }) {
  return (
    <EmptyState
      icon={CreditCard}
      title="No ad accounts found"
      description="Get started by creating your first ad account to begin managing your campaigns."
      action={onCreateAccount ? {
        label: "Create Ad Account",
        onClick: onCreateAccount,
        variant: 'default'
      } : undefined}
      type="first-time"
    />
  )
}

export function NoBusinessesFound({ onCreateBusiness }: { onCreateBusiness?: () => void }) {
  return (
    <EmptyState
      icon={Building2}
      title="No businesses found"
      description="Create your first Business Manager to start organizing your ad accounts."
      action={onCreateBusiness ? {
        label: "Create Business",
        onClick: onCreateBusiness,
        variant: 'default'
      } : undefined}
      type="first-time"
    />
  )
}

export function NoTeamMembersFound({ onInviteMembers }: { onInviteMembers?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No team members yet"
      description="Invite team members to collaborate on your ad campaigns and business management."
      action={onInviteMembers ? {
        label: "Invite Team Members",
        onClick: onInviteMembers,
        variant: 'default'
      } : undefined}
      type="first-time"
    />
  )
}

export function SearchNoResults({ query, onClearSearch }: { 
  query: string
  onClearSearch?: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No results match "${query}". Try adjusting your search terms or clearing filters.`}
      action={onClearSearch ? {
        label: "Clear Search",
        onClick: onClearSearch,
        variant: 'outline'
      } : undefined}
      type="search"
    />
  )
}

// ============================================================================
// COMPOUND STATES
// ============================================================================

interface DataStateProps<T> {
  data: T[]
  loading: boolean
  error?: string | Error
  emptyState: {
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  children: (data: T[]) => React.ReactNode
  retry?: () => void
  className?: string
}

export function DataState<T>({ 
  data, 
  loading, 
  error, 
  emptyState, 
  children, 
  retry,
  className 
}: DataStateProps<T>) {
  if (loading) {
    return <LoadingState message="Loading data..." className={className} />
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : error
    return (
      <ErrorState 
        message={errorMessage} 
        retry={retry} 
        className={className} 
      />
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
        className={className}
      />
    )
  }

  return <>{children(data)}</>
}

// ============================================================================
// STATUS INDICATORS
// ============================================================================

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'pending' | 'error' | 'success'
  label?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function StatusIndicator({ 
  status, 
  label, 
  size = 'medium',
  className 
}: StatusIndicatorProps) {
  const getConfig = () => {
    switch (status) {
      case 'online':
        return { color: 'bg-green-500', label: label || 'Online' }
      case 'offline':
        return { color: 'bg-gray-500', label: label || 'Offline' }
      case 'pending':
        return { color: 'bg-yellow-500', label: label || 'Pending' }
      case 'error':
        return { color: 'bg-red-500', label: label || 'Error' }
      case 'success':
        return { color: 'bg-green-500', label: label || 'Success' }
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'h-2 w-2'
      case 'large':
        return 'h-4 w-4'
      default:
        return 'h-3 w-3'
    }
  }

  const config = getConfig()

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("rounded-full", config.color, getSizeClass())} />
      {label && <span className="text-sm text-muted-foreground">{config.label}</span>}
    </div>
  )
} 