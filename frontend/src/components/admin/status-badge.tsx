import { cn } from "../../lib/utils"
import { getStatusConfig, type StatusType } from "../../lib/status-types"

interface StatusBadgeProps {
  status: StatusType | string
  size?: "sm" | "md"
  className?: string
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = getStatusConfig(status as StatusType)

  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        config.badgeStyles,
        className,
      )}
    >
      {config.label}
    </span>
  )
} 