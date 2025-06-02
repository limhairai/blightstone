import { cn } from "@/lib/utils"

type StatusType = "active" | "pending" | "completed" | "failed" | "disabled" | "archived"

interface StatusBadgeProps {
  status: StatusType
  className?: string
  children?: React.ReactNode
}

export function StatusBadge({ status, className, children }: StatusBadgeProps) {
  const statusClasses = {
    active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700/50",
    pending: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700/50",
    completed: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700/50",
    failed: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50",
    disabled: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50",
    archived: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-900/50",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusClasses[status],
        className
      )}
    >
      <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", `dot-${status}`)} />
      {children || status}
    </span>
  )
} 