import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "pending" | "inactive" | "suspended" | "restricted" | "error" | "paused" | "rejected" | "processing" | "completed"
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        }
      case "pending":
        return {
          label: "Pending",
          className:
            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
        }
      case "processing":
        return {
          label: "Processing",
          className:
            "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        }
      case "completed":
        return {
          label: "Completed",
          className:
            "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        }
      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        }
      case "error":
        return {
          label: "Error",
          className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        }
      case "paused":
      case "inactive":
        return {
          label: "Inactive",
          className:
            "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-700",
        }
      case "suspended":
        return {
          label: "Suspended",
          className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        }
      case "restricted":
        return {
          label: "Restricted",
          className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
        }
      default:
        return {
          label: status,
          className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-700",
        }
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium rounded-md border",
        sizeClasses,
        config.className
      )}
    >
      {config.label}
    </Badge>
  )
} 