import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for admin tables
function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card skeleton for dashboard metrics
function CardSkeleton() {
  return (
    <div className="p-6 border border-border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// Infrastructure monitoring skeleton
function InfrastructureMetricsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Status sections */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableSkeleton rows={3} columns={5} />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableSkeleton rows={4} columns={6} />
      </div>
    </div>
  )
}

// Billing page skeleton
function BillingPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Financial overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      
      {/* Recent transactions */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableSkeleton rows={5} columns={7} />
      </div>
      
      {/* Client balances */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableSkeleton rows={4} columns={6} />
      </div>
    </div>
  )
}

// Applications page skeleton
function ApplicationsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      {/* Applications table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <TableSkeleton rows={6} columns={8} />
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  TableSkeleton, 
  CardSkeleton, 
  InfrastructureMetricsSkeleton,
  BillingPageSkeleton,
  ApplicationsPageSkeleton
}
