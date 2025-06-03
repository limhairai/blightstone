import { cn } from "@/lib/utils"

type StatusType = "active" | "pending" | "failed" | "disabled" | "archived" | "inactive" | "error" | "warning" | "success" | "info" | "suspended" | "idle" | "completed"

interface StatusDotProps {
  status: StatusType
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  const statusClasses = {
    active: "bg-green-500 dark:bg-green-400",
    pending: "bg-orange-500 dark:bg-orange-400",
    failed: "bg-red-500 dark:bg-red-600",
    disabled: "bg-gray-400 dark:bg-gray-500",
    archived: "bg-gray-400 dark:bg-gray-500",
    inactive: "bg-gray-400 dark:bg-gray-500",
    error: "bg-red-600 dark:bg-red-700",
    warning: "bg-yellow-500 dark:bg-yellow-400",
    success: "bg-green-500 dark:bg-green-400",
    info: "bg-blue-500 dark:bg-blue-400",
    suspended: "bg-zinc-500 dark:bg-zinc-600",
    idle: "bg-gray-300 dark:bg-gray-600",
    completed: "bg-purple-500 dark:bg-purple-400",
  }

  return <span className={cn("inline-block h-2 w-2 rounded-full", statusClasses[status], className)} />
} 