import { cn } from "@/lib/utils"
import { type StatusType, getStatusConfig, normalizeStatus } from "@/lib/status-types"

interface StatusBadgeProps {
  status: StatusType | string // Accept both strict types and strings for flexibility
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  // Normalize the status to ensure consistency
  const normalizedStatus = typeof status === 'string' ? normalizeStatus(status) : status
  const config = getStatusConfig(normalizedStatus)

  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.badgeStyles,
        className
      )}
    >
      {config.label}
    </span>
  )
} 