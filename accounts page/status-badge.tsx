import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "pending" | "inactive" | "suspended" | "error" | "paused"
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className:
            "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        }
      case "pending":
        return {
          label: "Pending",
          className:
            "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        }
      case "error":
        return {
          label: "Error",
          className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        }
      case "paused":
      case "inactive":
        return {
          label: "Inactive",
          className:
            "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        }
      case "suspended":
        return {
          label: "Suspended",
          className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        }
      default:
        return {
          label: "Unknown",
          className:
            "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant="outline"
      className={cn(config.className, size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1")}
    >
      {config.label}
    </Badge>
  )
}
