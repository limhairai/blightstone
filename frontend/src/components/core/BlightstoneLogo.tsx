import { cn } from "../../lib/utils"

interface BlightstoneLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function BlightstoneLogo({ className, size = "md" }: BlightstoneLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={cn("font-bold", sizeClasses[size], className)}>
      <span className="text-white">Blight</span>
      <span className="bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent">
        stone
      </span>
    </div>
  )
} 