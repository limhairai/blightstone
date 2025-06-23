import { cn } from "@/lib/utils"
import { getStatusText } from "@/lib/design-tokens"

interface StatusBadgeProps {
  status: "active" | "pending" | "inactive" | "suspended" | "error" | "failed"
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    // Use mellow, brand-aligned colors with good readability
    switch (status) {
      case "active":
        return "bg-[#87CEEB] text-[#2F4F4F] border-[#87CEEB]" // Mellow sky blue
      case "pending":
        return "bg-[#DDA0DD] text-[#4B0082] border-[#DDA0DD]" // Mellow plum
      case "failed":
      case "error":
        return "bg-[#F0A0A0] text-[#8B0000] border-[#F0A0A0]" // Mellow coral
      case "inactive":
      case "suspended":
        return "bg-[#D3D3D3] text-[#696969] border-[#D3D3D3]" // Mellow gray
      default:
        return "bg-[#D3D3D3] text-[#696969] border-[#D3D3D3]"
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
