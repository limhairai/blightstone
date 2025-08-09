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
    <div className={cn("font-bold font-inter", sizeClasses[size], className)}>
      <span className="text-foreground">Blight</span>
      <span className="text-muted-foreground">
        stone
      </span>
    </div>
  )
} 