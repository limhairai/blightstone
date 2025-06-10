import { cn } from "@/lib/utils"
import { contentTokens } from "@/lib/content-tokens"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  className?: string
  label?: string
}

export function LoadingSpinner({ 
  size = "medium", 
  className,
  label = contentTokens.loading.default
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
    </div>
  )
}
