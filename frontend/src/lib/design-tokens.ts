// AdHub Design Token System
// Comprehensive design tokens for consistent UI/UX across the application

// -----------------------------------------------
// Color Tokens
// -----------------------------------------------

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

// -----------------------------------------------
// Gradient Tokens
// -----------------------------------------------

export const gradientTokens = {
  // Primary gradient for buttons and interactive elements
  // Using consistent brand colors across all themes
  primary: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] hover:opacity-90 text-black",
  
  // Light gradient for backgrounds and subtle elements
  // Light mode: more transparent for better contrast
  // Dark mode: slightly more opaque for visibility
  light: "bg-gradient-to-r from-[#b4a0ff]/10 to-[#ffb4a0]/10 dark:from-[#b4a0ff]/20 dark:to-[#ffb4a0]/20",
  
  // Avatar gradient for profile pictures and business logos
  // Single gradient that works well in both light and dark modes
  avatar: "bg-gradient-to-r from-[#b4a0ff]/20 to-[#ffb4a0]/20 text-gray-800 dark:text-white",
  
  // Text gradient for special text elements
  text: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] bg-clip-text text-transparent",
  
  // Border gradient for special borders
  border: "border-[#b4a0ff]/20 dark:border-[#b4a0ff]/30",
}

// Transaction color tokens for consistent styling
export const transactionColorTokens = {
  deposit: {
    bg: "bg-emerald-100 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400"
  },
  withdrawal: {
    bg: "bg-red-100 dark:bg-red-500/20", 
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400"
  },
  transfer: {
    bg: "bg-blue-100 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400", 
    icon: "text-blue-600 dark:text-blue-400"
  },
  spend: {
    bg: "bg-orange-100 dark:bg-orange-500/20",
    text: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400"
  }
}

// -----------------------------------------------
// Typography Tokens
// -----------------------------------------------

export const typographyTokens = {
  fontFamily: {
    sans: ["Inter", "system-ui", "sans-serif"],
    mono: ["JetBrains Mono", "Consolas", "monospace"],
  },

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },

  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
  },

  // Typography Patterns - Consistent text styles for specific UI elements
  patterns: {
    // Page titles and main headings
    pageTitle: "text-xl font-semibold text-foreground",
    sectionTitle: "text-lg font-semibold text-foreground",
    cardTitle: "text-base font-semibold text-foreground",
    
    // Balance and monetary amounts
    balanceLarge: "text-2xl font-bold text-foreground", // For main balance displays
    balanceMedium: "text-xl font-semibold text-foreground", // For secondary balances
    balanceSmall: "text-base font-medium text-foreground", // For small amounts
    
    // Body text
    bodyLarge: "text-base text-foreground",
    bodyMedium: "text-sm text-foreground", 
    bodySmall: "text-xs text-foreground",
    
    // Muted text
    mutedLarge: "text-base text-muted-foreground",
    mutedMedium: "text-sm text-muted-foreground",
    mutedSmall: "text-xs text-muted-foreground",
    
    // Labels and captions
    label: "text-sm font-medium text-foreground",
    caption: "text-xs text-muted-foreground",
    
    // Interactive elements
    buttonText: "text-sm font-medium",
    linkText: "text-sm text-primary hover:underline",
    
    // Status and badges
    badgeText: "text-xs font-medium",
    statusText: "text-sm font-medium",
    
    // Form elements
    inputLabel: "text-sm font-medium text-foreground",
    inputText: "text-sm text-foreground",
    inputPlaceholder: "text-sm text-muted-foreground",
    
    // Table elements
    tableHeader: "text-xs font-medium text-muted-foreground",
    tableCell: "text-sm text-foreground",
    tableCellMuted: "text-sm text-muted-foreground",
    
    // Navigation
    navItem: "text-sm font-medium text-foreground",
    navItemMuted: "text-sm text-muted-foreground",
  }
}

// -----------------------------------------------
// Spacing Tokens
// -----------------------------------------------

export const spacingTokens = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem",    // 128px
  40: "10rem",   // 160px
  48: "12rem",   // 192px
  56: "14rem",   // 224px
  64: "16rem",   // 256px
  80: "20rem",   // 320px
  96: "24rem"    // 384px
}

// -----------------------------------------------
// Layout Tokens
// -----------------------------------------------
/**
 * Centralized layout tokens for consistent spacing across the app.
 * 
 * Usage examples:
 * - Page container: <div className={layoutTokens.spacing.container}>
 * - Card grid: <div className={layoutTokens.layouts.cardGrid}>
 * - Button group: <div className={layoutTokens.layouts.buttonGroup}>
 * - Custom combination: <div className={`grid ${layoutTokens.gridCols.cardsResponsive} ${layoutTokens.gaps.cardGrid}`}>
 * 
 * This ensures maintainability and design consistency across all pages and components.
 */

export const layoutTokens = {
  // Page-level spacing patterns
  spacing: {
    // Main page container spacing
    container: "space-y-6",
    // Section spacing within pages
    section: "space-y-4", 
    // Component spacing within sections
    component: "space-y-3",
    // Form field spacing
    formField: "space-y-2",
    // Tight spacing for related elements
    tight: "space-y-1",
  },

  // Grid and flex gaps
  gaps: {
    // Standard grid gaps
    gridSmall: "gap-3",
    gridMedium: "gap-4", 
    gridLarge: "gap-6",
    
    // Flex gaps for inline elements
    flexTight: "gap-1",
    flexSmall: "gap-2",
    flexMedium: "gap-3",
    flexLarge: "gap-4",
    
    // Special purpose gaps
    cardGrid: "gap-4", // For card grids
    formGrid: "gap-4", // For form layouts
    buttonGroup: "gap-2", // For button groups
    iconText: "gap-2", // For icon + text combinations
  },

  // Padding constants
  padding: {
    // Page-level padding (centralized in app shell)
    pageX: "px-6", // Horizontal page padding
    pageTop: "pt-4", // Top page padding
    
    // Component padding
    card: "p-4",
    cardHeader: "p-4 pb-2",
    cardContent: "p-4 pt-2",
    
    // Form padding
    formContainer: "p-6",
    formSection: "p-4",
    
    // Dialog padding
    dialog: "p-6",
    dialogHeader: "p-6 pb-4",
    dialogContent: "p-6 pt-0",
  },

  // Grid column patterns
  gridCols: {
    // Responsive grid patterns
    cardsResponsive: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    metricsResponsive: "grid-cols-1 md:grid-cols-3",
    formResponsive: "grid-cols-1 md:grid-cols-2",
    
    // Fixed patterns
    twoCol: "grid-cols-2",
    threeCol: "grid-cols-3", 
    fourCol: "grid-cols-4",
    
    // Dashboard specific
    dashboardMain: "grid-cols-1 lg:grid-cols-3", // Main dashboard layout
  },

  // Common layout combinations
  layouts: {
    // Page container with consistent spacing
    pageContainer: "space-y-6",
    
    // Card grid with consistent spacing
    cardGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    
    // Metrics grid
    metricsGrid: "grid grid-cols-1 md:grid-cols-3 gap-4",
    
    // Form layout
    formLayout: "space-y-2",
    
    // Button group
    buttonGroup: "flex gap-2",
    
    // Icon with text
    iconText: "flex items-center gap-2",
  },
}

// -----------------------------------------------
// Component Tokens
// -----------------------------------------------

export const componentTokens = {
  button: {
    borderRadius: "0.5rem",
    padding: {
      sm: "0.5rem 0.75rem",
      md: "0.625rem 1rem",
      lg: "0.75rem 1.25rem",
    },
    fontSize: {
      sm: "0.875rem",
      md: "0.875rem",
      lg: "1rem",
    },
    height: {
      sm: "2rem",
      md: "2.25rem",
      lg: "2.5rem",
    },
  },

  input: {
    borderRadius: "0.5rem",
    padding: "0.625rem 0.75rem",
    fontSize: "0.875rem",
    height: "2.25rem",
    borderWidth: "1px",
  },

  card: {
    borderRadius: "0.5rem", // Reduced from 0.75rem
    padding: "1rem", // Reduced from 1.5rem
    borderWidth: "1px",
    shadow: "0 2px 5px 0 rgba(0, 0, 0, 0.05)", // Subtle shadow like Airwallex
  },

  badge: {
    borderRadius: "9999px",
    padding: "0.125rem 0.5rem",
    fontSize: "0.75rem",
    fontWeight: "500",
  },

  avatar: {
    borderRadius: "9999px",
    sizes: {
      sm: "1.5rem",
      md: "2rem",
      lg: "2.5rem",
      xl: "3rem",
    },
  },
}

// -----------------------------------------------
// Animation Tokens
// -----------------------------------------------

export const animationTokens = {
  duration: {
    fast: "150ms",
    normal: "200ms",
    slow: "300ms",
    slower: "500ms",
  },

  easing: {
    linear: "linear",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  },

  scale: {
    enter: "scale(0.95)",
    exit: "scale(1.05)",
  },
}

// -----------------------------------------------
// Shadow Tokens
// -----------------------------------------------

export const shadowTokens = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
  glow: "0 0 0 3px rgb(180 160 255 / 0.1)",
}

// -----------------------------------------------
// Status Tokens - STANDARDIZED
// -----------------------------------------------

export const statusTokens = {
  // Status colors for badges, indicators, and text
  active: {
    dot: "bg-[#22c55e]", // Consistent green for active status dots
    badge: {
      light: {
        bg: "#f0fdf4",
        text: "#16a34a",
        border: "#dcfce7",
      },
      dark: {
        bg: "rgba(22, 163, 74, 0.2)",
        text: "#4ade80",
        border: "rgba(22, 163, 74, 0.5)",
      },
    },
    progress: {
      low: "#22c55e", // Green for low usage (good)
      medium: "#f59e0b", // Amber for medium usage (warning)
      high: "#ef4444", // Red for high usage (danger)
    },
    text: {
      light: "#16a34a",
      dark: "#4ade80",
    },
  },
  pending: {
    dot: "bg-[#f59e0b]", // Consistent amber for pending status dots
    badge: {
      light: {
        bg: "#fffbeb",
        text: "#b45309",
        border: "#fef3c7",
      },
      dark: {
        bg: "rgba(180, 83, 9, 0.2)",
        text: "#fcd34d",
        border: "rgba(180, 83, 9, 0.5)",
      },
    },
    text: {
      light: "#b45309",
      dark: "#fcd34d",
    },
  },
  failed: {
    dot: "bg-[#ef4444]", // Consistent red for failed status dots
    badge: {
      light: {
        bg: "#fef2f2",
        text: "#dc2626",
        border: "#fee2e2",
      },
      dark: {
        bg: "rgba(220, 38, 38, 0.2)",
        text: "#f87171",
        border: "rgba(220, 38, 38, 0.5)",
      },
    },
    text: {
      light: "#dc2626",
      dark: "#f87171",
    },
  },
  inactive: {
    dot: "bg-[#71717a]", // Consistent gray for inactive status dots
    badge: {
      light: {
        bg: "#f9fafb",
        text: "#4b5563",
        border: "#e5e7eb",
      },
      dark: {
        bg: "rgba(75, 85, 99, 0.2)",
        text: "#d1d5db",
        border: "rgba(75, 85, 99, 0.5)",
      },
    },
    text: {
      light: "#4b5563",
      dark: "#d1d5db",
    },
  },
  // Transaction-specific colors
  transaction: {
    positive: {
      text: {
        light: "#16a34a",
        dark: "#4ade80",
      },
      prefix: "+",
    },
    negative: {
      text: {
        light: "#111827",
        dark: "#f9fafb",
      },
      prefix: "-",
    },
  },
  // Progress indicators
  progress: {
    low: {
      color: "#22c55e", // Green for < 60%
      bg: "rgba(34, 197, 94, 0.2)",
    },
    medium: {
      color: "#f59e0b", // Amber for 60-80%
      bg: "rgba(245, 158, 11, 0.2)",
    },
    high: {
      color: "#ef4444", // Red for > 80%
      bg: "rgba(239, 68, 68, 0.2)",
    },
    empty: {
      color: "#71717a", // Gray for 0%
      bg: "rgba(113, 113, 122, 0.2)",
    },
  },
}

// -----------------------------------------------
// Utility Functions
// -----------------------------------------------

export const getColorToken = (path: string, mode: "light" | "dark" = "light") => {
  const keys = path.split(".")
  let value: any = colorTokens

  for (const key of keys) {
    value = value?.[key]
  }

  return value || path
}

export const getSpacing = (size: keyof typeof spacingTokens) => {
  return spacingTokens[size]
}

export const getStatusColor = (status: keyof typeof statusTokens, mode: "light" | "dark" = "light") => {
  const tokenSet = statusTokens[status];
  // Check if tokenSet itself and tokenSet.text are objects, and if mode is a key in tokenSet.text
  if (
    typeof tokenSet === 'object' &&
    tokenSet !== null &&
    'text' in tokenSet &&
    typeof tokenSet.text === 'object' &&
    tokenSet.text !== null &&
    mode in tokenSet.text
  ) {
    // Type assertion because TypeScript still struggles with complex discriminated unions here
    return (tokenSet.text as Record<"light" | "dark", string>)[mode];
  }
  // Fallback if the structure doesn't match
  return mode === 'light' ? colorTokens.neutral[700] : colorTokens.neutral[300];
}

// Get status dot color
export const getStatusDot = (status: "active" | "pending" | "failed" | "inactive") => {
  switch (status) {
    case "active":
      return "bg-status-active-dot";
    case "pending":
      return "bg-status-pending-dot";
    case "failed":
      return "bg-status-failed-dot";
    case "inactive":
      return "bg-status-inactive-dot";
    default:
      return ""; // Or a default dot color class
  }
}

// Get badge classes for a status
export const getStatusBadgeClasses = (
  status: "active" | "pending" | "failed" | "inactive",
  mode: "light" | "dark" = "dark", // Consider changing default to 'light' or making mode required
) => {
  if (status === "active") {
    if (mode === "light") {
      return "bg-status-active-badge-bg-light text-status-active-badge-fg-light border-status-active-badge-border-light";
    }
    // Dark mode for active status
    return "bg-status-active-badge-bg-dark text-status-active-badge-fg-dark border-status-active-badge-border-dark";
  } else if (status === "pending") {
    if (mode === "light") {
      return "bg-status-pending-badge-bg-light text-status-pending-badge-fg-light border-status-pending-badge-border-light";
    }
    // Dark mode for pending status
    return "bg-status-pending-badge-bg-dark text-status-pending-badge-fg-dark border-status-pending-badge-border-dark";
  } else if (status === "failed") {
    if (mode === "light") {
      return "bg-status-failed-badge-bg-light text-status-failed-badge-fg-light border-status-failed-badge-border-light";
    }
    // Dark mode for failed status
    return "bg-status-failed-badge-bg-dark text-status-failed-badge-fg-dark border-status-failed-badge-border-dark";
  } else if (status === "inactive") {
    if (mode === "light") {
      return "bg-status-inactive-badge-bg-light text-status-inactive-badge-fg-light border-status-inactive-badge-border-light";
    }
    // Dark mode for inactive status
    return "bg-status-inactive-badge-bg-dark text-status-inactive-badge-fg-dark border-status-inactive-badge-border-dark";
  }

  // Fallback for any unknown status, or if logic is not yet implemented
  return ""; 
}

// Get progress color based on percentage
export const getProgressColor = (percentage: number) => {
  if (percentage === 0) {
    return {
      fg: "text-status-progress-empty-fg",
      bg: "bg-status-progress-empty-bg",
    };
  }
  if (percentage < 60) {
    return {
      fg: "text-status-progress-low-fg",
      bg: "bg-status-progress-low-bg",
    };
  }
  if (percentage < 80) {
    return {
      fg: "text-status-progress-medium-fg",
      bg: "bg-status-progress-medium-bg",
    };
  }
  return {
    fg: "text-status-progress-high-fg",
    bg: "bg-status-progress-high-bg",
  };
}

// NEW FUNCTION: Get usage circle color value (hex string)
export const getUsageCircleColorValue = (percentage: number): string => {
  if (percentage === 0) {
    return statusTokens.progress.empty.color;
  }
  if (percentage < 60) {
    return statusTokens.progress.low.color;
  }
  if (percentage < 80) { // 60-79 is medium
    return statusTokens.progress.medium.color;
  }
  return statusTokens.progress.high.color; // 80+ is high
};

// Get transaction amount color and prefix
export const getTransactionAmountStyle = (amount: number, mode: "light" | "dark" = "dark") => {
  if (amount > 0) {
    return {
      className: mode === "light" ? "text-status-transaction-positive-fg-light" : "text-status-transaction-positive-fg-dark",
      prefix: statusTokens.transaction.positive.prefix,
    };
  }
  return {
    className: mode === "light" ? "text-status-transaction-negative-fg-light" : "text-status-transaction-negative-fg-dark",
    prefix: statusTokens.transaction.negative.prefix,
  };
}

// -----------------------------------------------
// Gradient Utilities
// -----------------------------------------------

// Get gradient classes by type
export const getGradient = (type: keyof typeof gradientTokens) => {
  return gradientTokens[type];
}

// Get gradient classes by type and mode
export const getGradientByMode = (type: keyof typeof gradientTokens, mode: "light" | "dark" = "light") => {
  return gradientTokens[type][mode];
}

// Get transaction color classes by type
export const getTransactionColors = (type: keyof typeof transactionColorTokens) => {
  return transactionColorTokens[type];
}

// Get transaction color classes by type and mode
export const getTransactionColorsByMode = (type: keyof typeof transactionColorTokens, mode: "light" | "dark" = "light") => {
  return {
    icon: transactionColorTokens[type].icon[mode],
    text: transactionColorTokens[type].text[mode],
  };
}

// Avatar utility functions using design tokens
export const getAvatarClasses = (size: 'sm' | 'md' | 'lg' = 'md', mode: "light" | "dark" = "light"): string => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base', 
    lg: 'h-16 w-16 text-2xl'
  }
  
  return `${sizeClasses[size]} ${gradientTokens.avatar} font-semibold rounded-lg flex items-center justify-center`
}

export const getBusinessAvatarClasses = (size: 'sm' | 'md' | 'lg' = 'md', mode: "light" | "dark" = "light"): string => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base'
  }
  
  return `${sizeClasses[size]} ${gradientTokens.avatar} font-medium rounded-md flex items-center justify-center`
}

// -----------------------------------------------
// CSS Custom Properties Generator
// -----------------------------------------------

export const generateCSSVariables = (mode: "light" | "dark" = "light") => {
  const modeColors = colorTokens[mode]

  return {
    "--color-background": modeColors.background,
    "--color-surface": modeColors.surface,
    "--color-surface-secondary": modeColors.surfaceSecondary,
    "--color-border": modeColors.border,
    "--color-border-subtle": modeColors.borderSubtle,
    "--color-text-primary": modeColors.text.primary,
    "--color-text-secondary": modeColors.text.secondary,
    "--color-text-tertiary": modeColors.text.tertiary,
    "--color-brand-primary": colorTokens.brand.primary[400],
    "--color-brand-secondary": colorTokens.brand.secondary[400],
    "--shadow-sm": shadowTokens.sm,
    "--shadow-md": shadowTokens.md,
    "--shadow-lg": shadowTokens.lg,
    "--radius-sm": "0.25rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--spacing-xs": spacingTokens[1],
    "--spacing-sm": spacingTokens[2],
    "--spacing-md": spacingTokens[4],
    "--spacing-lg": spacingTokens[6],
    "--spacing-xl": spacingTokens[8],

    // Status colors
    "--status-active-dot": statusTokens.active.dot.replace("bg-", ""),
    "--status-pending-dot": statusTokens.pending.dot.replace("bg-", ""),
    "--status-failed-dot": statusTokens.failed.dot.replace("bg-", ""),
    "--status-inactive-dot": statusTokens.inactive.dot.replace("bg-", ""),

    // Transaction colors
    "--transaction-positive": statusTokens.transaction.positive.text[mode],
    "--transaction-negative": statusTokens.transaction.negative.text[mode],
  }
}

// Layout token utilities
export const getLayoutSpacing = (type: keyof typeof layoutTokens.spacing) => {
  return layoutTokens.spacing[type]
}

export const getLayoutGap = (type: keyof typeof layoutTokens.gaps) => {
  return layoutTokens.gaps[type]
}

export const getLayoutPadding = (type: keyof typeof layoutTokens.padding) => {
  return layoutTokens.padding[type]
}

export const getGridCols = (type: keyof typeof layoutTokens.gridCols) => {
  return layoutTokens.gridCols[type]
}

export const getLayout = (type: keyof typeof layoutTokens.layouts) => {
  return layoutTokens.layouts[type]
}

// Utility to combine layout classes
export const combineLayoutClasses = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ')
}

const allDesignTokens = {
  colors: colorTokens,
  gradients: gradientTokens,
  transactionColors: transactionColorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  components: componentTokens,
  animations: animationTokens,
  shadows: shadowTokens,
  status: statusTokens,
  utils: {
    getColorToken,
    getSpacing,
    getStatusColor,
    getStatusDot,
    getStatusBadgeClasses,
    getProgressColor,
    getUsageCircleColorValue,
    getTransactionAmountStyle,
    getGradient,
    getGradientByMode,
    getTransactionColors,
    getTransactionColorsByMode,
    getAvatarClasses,
    getBusinessAvatarClasses,
    generateCSSVariables,
    getLayoutSpacing,
    getLayoutGap,
    getLayoutPadding,
    getGridCols,
    getLayout,
    combineLayoutClasses,
  },
};

export default allDesignTokens;