import { cn } from "@/lib/utils"

interface StatusDotProps {
  status: "active" | "pending" | "inactive" | "suspended" | "error" | "paused"
  size?: "sm" | "md"
}

export function StatusDot({ status, size = "md" }: StatusDotProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-[hsl(145,63%,55%)]" // Brighter green for dark
      case "pending":
        return "bg-[hsl(36,93%,60%)]" // Brighter amber for dark
      case "error":
        return "bg-[hsl(0,84%,65%)]" // Brighter red for dark
      case "paused":
      case "inactive":
        return "bg-[hsl(240,3%,60%)]" // Brighter gray for dark
      case "suspended":
        return "bg-[hsl(0,84%,65%)]" // Brighter red for dark
      default:
        return "bg-muted-foreground"
    }
  }

  return <div className={cn("rounded-full", size === "sm" ? "w-2 h-2" : "w-3 h-3", getStatusColor(status))} />
}
