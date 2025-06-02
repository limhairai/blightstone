import type React from "react"
import { cn } from "@/lib/utils"

type StatusType = "active" | "pending" | "completed" | "failed" | "disabled" | "archived" | "inactive" | "new"

interface StatusBadgeProps {
  status: StatusType
  className?: string
  size?: "sm" | "md" | "lg"
  children?: React.ReactNode
}

export function StatusBadge({ status, className, size = "md", children }: StatusBadgeProps) {
  const statusClasses = {
    active:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700/50",
    pending:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700/50",
    completed:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700/50",
    failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50",
    disabled:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50",
    archived:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50",
    inactive:
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50",
    new:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/50",
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        statusClasses[status],
        sizeClasses[size],
        className,
      )}
    >
      {children || status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
