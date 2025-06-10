// Centralized status types and configurations
// This is the single source of truth for all status-related types and styling

export type StatusType = 
  | "active" 
  | "pending" 
  | "inactive" 
  | "suspended" 
  | "error" 
  | "paused" 
  | "disabled" 
  | "idle" 
  | "archived" 
  | "warning" 
  | "success" 
  | "info"
  | "failed"
  | "completed"

// Status configuration with colors and labels
export interface StatusConfig {
  label: string
  dotColor: string
  badgeStyles: string
}

export const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  active: {
    label: "Active",
    dotColor: "bg-[#00c853] dark:bg-[#34D197]",
    badgeStyles: "bg-green-100/80 text-green-800 border-green-300/50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700/50"
  },
  pending: {
    label: "Pending",
    dotColor: "bg-[#FFC857] dark:bg-[#FFC857]",
    badgeStyles: "bg-amber-100/80 text-amber-800 border-amber-300/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50"
  },
  inactive: {
    label: "Inactive",
    dotColor: "bg-gray-400 dark:bg-gray-500",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  suspended: {
    label: "Suspended",
    dotColor: "bg-[#F56565] dark:bg-[#F56565]",
    badgeStyles: "bg-red-100/80 text-red-800 border-red-300/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50"
  },
  error: {
    label: "Failed",
    dotColor: "bg-[#F56565] dark:bg-[#F56565]",
    badgeStyles: "bg-red-100/80 text-red-800 border-red-300/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50"
  },
  failed: {
    label: "Failed",
    dotColor: "bg-[#F56565] dark:bg-[#F56565]",
    badgeStyles: "bg-red-100/80 text-red-800 border-red-300/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50"
  },
  paused: {
    label: "Inactive",
    dotColor: "bg-[#FFC857] dark:bg-[#FFC857]",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  disabled: {
    label: "Inactive",
    dotColor: "bg-gray-400 dark:bg-gray-500",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  idle: {
    label: "Inactive",
    dotColor: "bg-gray-300 dark:bg-gray-600",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  archived: {
    label: "Archived",
    dotColor: "bg-gray-400 dark:bg-gray-500",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  warning: {
    label: "Warning",
    dotColor: "bg-[#FFC857] dark:bg-[#FFC857]",
    badgeStyles: "bg-amber-100/80 text-amber-800 border-amber-300/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700/50"
  },
  success: {
    label: "Success",
    dotColor: "bg-[#00c853] dark:bg-[#34D197]",
    badgeStyles: "bg-green-100/80 text-green-800 border-green-300/50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700/50"
  },
  info: {
    label: "Info",
    dotColor: "bg-blue-500 dark:bg-blue-400",
    badgeStyles: "bg-blue-100/80 text-blue-800 border-blue-300/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-700/50"
  },
  completed: {
    label: "Completed",
    dotColor: "bg-[#00c853] dark:bg-[#34D197]",
    badgeStyles: "bg-green-100/80 text-green-800 border-green-300/50 dark:bg-green-950/30 dark:text-green-300 dark:border-green-700/50"
  }
}

// Helper function to get status configuration
export function getStatusConfig(status: StatusType): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.inactive
}

// Helper function to normalize status values (handles legacy/variant status names)
export function normalizeStatus(status: string): StatusType {
  const normalized = status.toLowerCase()
  
  // Handle common variations
  switch (normalized) {
    case "rejected":
      return "error"
    case "not_verified":
      return "inactive"
    case "verified":
      return "active"
    default:
      // Check if it's a valid status type
      if (normalized in STATUS_CONFIG) {
        return normalized as StatusType
      }
      // Fallback to inactive for unknown statuses
      return "inactive"
  }
} 