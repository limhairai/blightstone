import { cn } from "../../lib/utils"

interface AdHubLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function AdHubLogo({ className, size = "md" }: AdHubLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={cn("font-bold", sizeClasses[size], className)}>
      <span className="text-white">
        Ad
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: "linear-gradient(90deg, #b4a0ff 0%, #ffb4a0 100%)",
          }}
        >
          Hub
        </span>
      </span>
    </div>
  )
} 