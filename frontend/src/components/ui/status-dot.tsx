import { cn } from "@/lib/utils"
import { type StatusType, getStatusConfig, normalizeStatus } from "@/lib/status-types"

interface StatusDotProps {
  status: StatusType | string // Accept both strict types and strings for flexibility
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  // Normalize the status to ensure consistency
  const normalizedStatus = typeof status === 'string' ? normalizeStatus(status) : status
  const config = getStatusConfig(normalizedStatus)

  return (
    <span 
      className={cn(
        "inline-block h-2 w-2 rounded-full", 
        config.dotColor, 
        className
      )} 
    />
  )
} 