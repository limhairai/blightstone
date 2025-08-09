interface PlatformIconProps {
  platform: string
  size?: "sm" | "md"
}

export function PlatformIcon({ platform, size = "md" }: PlatformIconProps) {
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-5 h-5"

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case "Meta":
        return {
          bg: "bg-secondary",
          text: "f",
          textColor: "text-white",
        }
      case "Google":
        return {
          bg: "bg-muted",
          text: "G",
          textColor: "text-white",
        }
      case "TikTok":
        return {
          bg: "bg-black",
          text: "T",
          textColor: "text-white",
        }
      case "LinkedIn":
        return {
          bg: "bg-secondary",
          text: "in",
          textColor: "text-white",
        }
      default:
        return {
          bg: "bg-muted",
          text: "?",
          textColor: "text-muted-foreground",
        }
    }
  }

  const config = getPlatformConfig(platform)

  return (
    <div className={`${sizeClasses} ${config.bg} rounded flex items-center justify-center`}>
      <span className={`text-xs font-bold ${config.textColor}`}>{config.text}</span>
    </div>
  )
}
