import { cn } from "@/lib/utils"

type StatusType = "active" | "pending" | "completed" | "failed" | "disabled" | "archived" | "inactive"

interface StatusDotProps {
  status: StatusType
  className?: string
}

export function StatusDot({ status, className }: StatusDotProps) {
  const statusClasses = {
    active: "bg-green-500 dark:bg-green-400",
    pending: "bg-orange-500 dark:bg-orange-400",
    completed: "bg-purple-500 dark:bg-purple-400",
    failed: "bg-red-500",
    disabled: "bg-gray-400",
    archived: "bg-gray-400",
    inactive: "bg-gray-400",
  }

  return <span className={cn("inline-block h-2 w-2 rounded-full", statusClasses[status], className)} />
}
