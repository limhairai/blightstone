export const colorTokens = {
  // Brand Colors
  brand: {
    primary: {
      50: "#faf7ff",
      100: "#f0e6ff",
      200: "#e4d3ff",
      300: "#d1b3ff",
      400: "#b4a0ff", // Main brand purple
      500: "#9e77ed",
      600: "#6941c6", // Darker purple for light mode
      700: "#553c9a",
      800: "#44337a",
      900: "#372d63",
    },
    secondary: {
      50: "#fff9f5",
      100: "#fff4e5",
      200: "#fedfb0",
      300: "#fdc68a",
      400: "#ffb4a0", // Main brand peach
      500: "#f9a8d4",
      600: "#dc6803", // Darker peach for light mode
      700: "#b54708",
      800: "#92400e",
      900: "#78350f",
    },
  },
  
  // Semantic Colors
  semantic: {
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      300: "#86efac",
      400: "#4ade80", // Main success green
      500: "#22c55e",
      600: "#16a34a",
      900: "#064e3b",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      300: "#fcd34d",
      400: "#f59e0b", // Main warning amber
      500: "#d97706",
      600: "#b45309",
      900: "#78350f",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      300: "#fca5a5",
      400: "#f87171", // Main error red
      500: "#ef4444",
      600: "#dc2626",
      900: "#7f1d1d",
    },
    info: {
      50: "#eff6ff",
      100: "#dbeafe",
      300: "#93c5fd",
      400: "#60a5fa", // Main info blue
      500: "#3b82f6",
      600: "#2563eb",
      900: "#1e3a8a",
    },
    neutral: {
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
    },
  },

  // Neutral Colors
  neutral: {
    0: "#ffffff",
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },

  // Mode-specific tokens
  light: {
    background: "#f9fafb",
    surface: "#ffffff",
    surfaceSecondary: "#f3f4f6",
    border: "#e5e7eb",
    borderSubtle: "#f3f4f6",
    text: {
      primary: "#111827",
      secondary: "#4b5563",
      tertiary: "#6b7280",
      inverse: "#ffffff",
    },
  },

  dark: {
    background: "#030712",
    surface: "#111827",
    surfaceSecondary: "#1f2937",
    border: "#374151",
    borderSubtle: "#1f2937",
    text: {
      primary: "#f9fafb",
      secondary: "#d1d5db",
      tertiary: "#9ca3af",
      inverse: "#111827",
    },
  },
}

export const colors = colorTokens

// Utility functions
export const getColorToken = (path: string) => {
  const parts = path.split('.')
  let current: any = colorTokens
  for (const part of parts) {
    if (current[part] === undefined) return null
    current = current[part]
  }
  return current
}

export const getSpacing = (size: number) => `${size * 4}px`

export const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    active: colorTokens.semantic.success[400],
    pending: colorTokens.semantic.warning[400],
    inactive: colorTokens.semantic.neutral[400],
    error: colorTokens.semantic.error[400],
  }
  return statusColors[status] || colorTokens.semantic.neutral[400]
}

export const getStatusDot = (status: string) => {
  const color = getStatusColor(status)
  return `w-2 h-2 rounded-full bg-[${color}]`
}

export const getStatusBadgeClasses = (status: string) => {
  const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
  const statusClasses: Record<string, string> = {
    active: `${baseClasses} bg-success-50 text-success-600`,
    pending: `${baseClasses} bg-warning-50 text-warning-600`,
    inactive: `${baseClasses} bg-neutral-50 text-neutral-600`,
    error: `${baseClasses} bg-error-50 text-error-600`,
  }
  return statusClasses[status] || `${baseClasses} bg-neutral-50 text-neutral-600`
}

export const getProgressColor = (value: number) => {
  if (value >= 80) return colorTokens.semantic.success[400]
  if (value >= 50) return colorTokens.semantic.warning[400]
  return colorTokens.semantic.error[400]
}

export const getTransactionAmountStyle = (amount: number) => {
  return amount >= 0 ? 'text-success-600' : 'text-error-600'
}

export const generateCSSVariables = () => {
  const variables: Record<string, string> = {}
  
  const processObject = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object') {
        processObject(value, `${prefix}${key}-`)
      } else {
        variables[`--${prefix}${key}`] = value
      }
    })
  }
  
  processObject(colorTokens)
  return variables
}

export default {
  colors: colorTokens,
  utils: {
    getColorToken,
    getSpacing,
    getStatusColor,
    getStatusDot,
    getStatusBadgeClasses,
    getProgressColor,
    getTransactionAmountStyle,
    generateCSSVariables,
  },
} 