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
            "bg-green-50 text-foreground border-border dark:bg-secondary/20 dark:text-foreground dark:border-border",
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
            "bg-blue-50 text-foreground border-border dark:bg-secondary/20 dark:text-foreground dark:border-border",
        }
      case "completed":
        return {
          label: "Completed",
          className:
            "bg-green-50 text-foreground border-border dark:bg-secondary/20 dark:text-foreground dark:border-border",
        }
      case "rejected":
        return {
          label: "Rejected",
          className: "bg-red-50 text-muted-foreground border-border dark:bg-muted/20 dark:text-muted-foreground dark:border-border",
        }
      case "error":
        return {
          label: "Error",
          className: "bg-red-50 text-muted-foreground border-border dark:bg-muted/20 dark:text-muted-foreground dark:border-border",
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
          className: "bg-red-50 text-muted-foreground border-border dark:bg-muted/20 dark:text-muted-foreground dark:border-border",
        }
      case "restricted":
        return {
          label: "Restricted",
          className: "bg-orange-50 text-muted-foreground border-border dark:bg-muted/20 dark:text-muted-foreground dark:border-border",
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