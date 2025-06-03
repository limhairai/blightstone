import { getUsageCircleColorValue } from "@/lib/design-tokens"

interface UsageCircleProps {
  percentage: number
}

export function UsageCircle({ percentage }: UsageCircleProps) {
  // Calculate the stroke dash offset based on the percentage
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  // Use our centralized color system
  const circleColor = getUsageCircleColorValue(percentage)

  return (
    <div className="flex items-center">
      <svg width="40" height="40" viewBox="0 0 40 40" className="transform -rotate-90">
        {/* Background circle */}
        <circle cx="20" cy="20" r={radius} fill="none" strokeWidth="4" className="stroke-muted" />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ stroke: circleColor }}
        />
      </svg>
      <span className="ml-2 text-sm font-medium">{percentage}%</span>
    </div>
  )
}
