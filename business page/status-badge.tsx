import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "pending" | "inactive" | "suspended" | "error" | "paused"
  size?: "sm" | "md"
  variant?: "default" | "outline"
}

export function StatusBadge({ status, size = "md", variant = "default" }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          color:
            variant === "outline"
              ? "border-emerald-200 text-emerald-700 bg-emerald-50"
              : "bg-emerald-100 text-emerald-800",
        }
      case "pending":
        return {
          label: "Pending",
          color: variant === "outline" ? "border-amber-200 text-amber-700 bg-amber-50" : "bg-amber-100 text-amber-800",
        }
      case "error":
        return {
          label: "Error",
          color: variant === "outline" ? "border-red-200 text-red-700 bg-red-50" : "bg-red-100 text-red-800",
        }
      case "paused":
        return {
          label: "Paused",
          color: variant === "outline" ? "border-blue-200 text-blue-700 bg-blue-50" : "bg-blue-100 text-blue-800",
        }
      case "inactive":
        return {
          label: "Inactive",
          color: variant === "outline" ? "border-gray-200 text-gray-700 bg-gray-50" : "bg-gray-100 text-gray-800",
        }
      case "suspended":
        return {
          label: "Suspended",
          color: variant === "outline" ? "border-red-200 text-red-700 bg-red-50" : "bg-red-100 text-red-800",
        }
      default:
        return {
          label: "Unknown",
          color: variant === "outline" ? "border-gray-200 text-gray-700 bg-gray-50" : "bg-gray-100 text-gray-800",
        }
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
  const borderClass = variant === "outline" ? "border" : ""

  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", sizeClasses, borderClass, config.color)}>
      {config.label}
    </span>
  )
}
