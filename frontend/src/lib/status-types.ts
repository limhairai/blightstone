// Centralized status types and configurations
// This is the single source of truth for all status-related types and styling

export type StatusType = 
  | "active" 
  | "pending" 
  | "suspended" 
  | "restricted"
  | "connection_error"
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
  suspended: {
    label: "FB Suspended",
    dotColor: "bg-[#F56565] dark:bg-[#F56565]",
    badgeStyles: "bg-red-100/80 text-red-800 border-red-300/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-700/50"
  },
  restricted: {
    label: "FB Restricted",
    dotColor: "bg-[#FF8A65] dark:bg-[#FF8A65]",
    badgeStyles: "bg-orange-100/80 text-orange-800 border-orange-300/50 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-700/50"
  },
  connection_error: {
    label: "Connection Issue",
    dotColor: "bg-[#FFC857] dark:bg-[#FFC857]",
    badgeStyles: "bg-yellow-100/80 text-yellow-800 border-yellow-300/50 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-700/50"
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
    label: "Paused",
    dotColor: "bg-[#FFC857] dark:bg-[#FFC857]",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  disabled: {
    label: "Disabled",
    dotColor: "bg-gray-400 dark:bg-gray-500",
    badgeStyles: "bg-gray-100/80 text-gray-800 border-gray-300/50 dark:bg-gray-950/30 dark:text-gray-300 dark:border-gray-700/50"
  },
  idle: {
    label: "Idle",
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
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

// Helper function to normalize status values (handles legacy/variant status names)
export function normalizeStatus(status: string): StatusType {
  const normalized = status.toLowerCase()
  
  // Handle common variations
  switch (normalized) {
    case "rejected":
      return "error"
    case "not_verified":
      return "pending"
    case "verified":
      return "active"
    case "inactive":
      return "pending" // Convert legacy inactive to pending
    default:
      // Check if it's a valid status type
      if (normalized in STATUS_CONFIG) {
        return normalized as StatusType
      }
      // Fallback to pending for unknown statuses
      return "pending"
  }
} 