// Centralized color constants for the application
export const COLORS = {
  // Status colors
  status: {
    active: "#34D197", // Your preferred green
    pending: "#FFC857", // Warm amber with premium feel
    failed: "#F56565", // Coral-red that's vibrant but balanced
    inactive: "#6B7280", // Gray
  },

  // Transaction colors
  transaction: {
    positive: "#34D197", // Credits/deposits
    negative: "#FFFFFF", // Debits/withdrawals (use default text)
  },

  // Usage/progress colors
  usage: {
    low: "#34D197", // 0-60%
    medium: "#FFC857", // 60-80% - now using your pending color
    high: "#F56565", // 80-100% - now using your failed color
    empty: "#6B7280", // 0%
  },
} as const

// Helper functions for consistent color application
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
    case "completed":
    case "approved":
      return COLORS.status.active
    case "pending":
      return COLORS.status.pending
    case "failed":
    case "rejected":
    case "suspended":
      return COLORS.status.failed
    case "inactive":
    default:
      return COLORS.status.inactive
  }
}

export const getUsageColor = (percentage: number) => {
  if (percentage === 0) return COLORS.usage.empty
  if (percentage < 60) return COLORS.usage.low
  if (percentage < 80) return COLORS.usage.medium
  return COLORS.usage.high
} 