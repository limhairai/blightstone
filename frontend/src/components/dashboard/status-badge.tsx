import { cn } from "../../lib/utils"

interface StatusBadgeProps {
  status: "active" | "pending" | "inactive" | "suspended" | "error" | "paused"
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[hsl(145,85%,15%)] text-[hsl(145,74%,65%)] border-[hsl(145,63%,55%)]"
      case "pending":
        return "bg-[hsl(45,100%,12%)] text-[hsl(32,90%,55%)] border-[hsl(36,93%,60%)]"
      case "error":
        return "bg-[hsl(0,80%,12%)] text-[hsl(0,70%,60%)] border-[hsl(0,84%,65%)]"
      case "paused":
      case "inactive":
        return "bg-[hsl(210,17%,12%)] text-[hsl(220,13%,70%)] border-[hsl(240,3%,60%)]"
      case "suspended":
        return "bg-[hsl(0,80%,12%)] text-[hsl(0,70%,60%)] border-[hsl(0,84%,65%)]"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paused":
        return "Inactive"
      case "error":
        return "Failed"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center border rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        getStatusStyles(status),
      )}
    >
      {getStatusText(status)}
    </span>
  )
}
