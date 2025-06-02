// AdHub Design System
// Comprehensive design tokens and styling guidelines for the application

// -----------------------------------------------
// Base Tokens - Primitive values
// -----------------------------------------------

export const colors = {
  // Brand Colors
  primary: "#b4a0ff",
  primaryHover: "#9f84ca",
  secondary: "#ffb4a0",
  secondaryHover: "#e69d8c",

  // UI Colors
  background: "#0A0A0A",
  cardBackground: "#111111",
  cardBackgroundDarker: "#0a0a0a",
  border: "#222222",
  borderHover: "#333333",

  // Text Colors
  text: "#FFFFFF",
  textMuted: "#71717a",
  textSubtle: "#a1a1aa",

  // Status Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
}

export const gradients = {
  primary: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]",
  cardGradient: "bg-gradient-to-br from-[#111111] to-[#0a0a0a]",
  subtleCardGradient: "bg-gradient-to-br from-[#141414] to-[#0c0c0c]",
  darkGradient: "bg-gradient-to-br from-[#0c0c0c] to-[#050505]",
}

export const spacing = {
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
}

export const typography = {
  fontFamily: "Inter, sans-serif",

  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },

  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },

  lineHeight: {
    none: "1",
    tight: "1.25",
    snug: "1.375",
    normal: "1.5",
    relaxed: "1.625",
    loose: "2",
  },
}

export const borderRadius = {
  none: "0",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  full: "9999px",
}

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
}

export const zIndex = {
  0: "0",
  10: "10",
  20: "20",
  30: "30",
  40: "40",
  50: "50",
  auto: "auto",
}

export const animation = {
  default: "transition-all duration-200 ease-in-out",
  slow: "transition-all duration-300 ease-in-out",
  fast: "transition-all duration-100 ease-in-out",
}

// -----------------------------------------------
// Composite Tokens - Component-specific styling
// -----------------------------------------------

export const components = {
  // Dialog and card styling
  dialog: {
    container:
      "bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-lg shadow-lg overflow-hidden",
    header: "px-8 py-6 border-b border-[#222]",
    body: "px-8 py-8",
    footer: "px-8 py-6 border-t border-[#222]",
  },

  card: {
    container: "bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] rounded-lg",
    compact: "p-5",
    normal: "p-6",
    spacious: "p-8",
    interactive: "hover:border-[#444] transition-colors duration-200",
    selected: "border-[#b4a0ff] bg-black",
  },

  // Button variants
  button: {
    base: "font-medium rounded transition-all duration-200",
    sizes: {
      sm: "px-3 py-1 h-8 text-xs",
      md: "px-4 py-1.5 h-9 text-sm",
      lg: "px-5 py-2 h-10 text-base",
    },
    variants: {
      primary: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] text-black hover:opacity-90",
      secondary: "bg-[#1a1a1a] text-white hover:bg-[#222]",
      outline: "bg-transparent border border-[#333] text-white hover:bg-[#222] hover:border-[#444]",
      ghost: "bg-transparent text-white hover:bg-[#1a1a1a]",
    },
  },

  // Form elements
  form: {
    label: "block text-xs font-medium text-gray-400 mb-1.5",
    input:
      "w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#b4a0ff] focus:border-[#b4a0ff]",
    select:
      "w-full bg-[#111] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#b4a0ff] focus:border-[#b4a0ff]",
    checkbox: "h-4 w-4 rounded border-[#333] text-[#b4a0ff] focus:ring-[#b4a0ff] focus:ring-offset-black",
    helpText: "mt-1 text-xs text-gray-500",
    error: "mt-1 text-xs text-red-500",
  },

  // Progress indicators
  progress: {
    container: "flex justify-between items-center relative",
    track: "absolute top-5 left-0 right-0 h-[1px] bg-[#333]",
    indicator:
      "absolute top-5 left-0 h-[1px] bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0] transition-all duration-300 ease-in-out",
    step: {
      container: "flex flex-col items-center z-10",
      circle: {
        base: "w-10 h-10 rounded-full flex items-center justify-center",
        active: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]",
        inactive: "bg-[#1a1a1a]",
        completed: "bg-gradient-to-r from-[#b4a0ff] to-[#ffb4a0]",
      },
      label: {
        base: "mt-2 text-xs font-medium",
        active: "text-white",
        inactive: "text-gray-600",
      },
    },
  },

  // Layout elements
  layout: {
    header: "border-b border-[#222] py-4",
    pageTitle: "text-2xl font-medium text-white text-center mb-2",
    pageSubtitle: "text-sm text-gray-400 text-center mb-8",
    sectionTitle: "text-xl font-medium text-white mb-6",
    subsectionTitle: "text-sm font-medium mb-4 text-[#b4a0ff]",
  },

  // Application forms
  application: {
    pageWrapper: "min-h-screen bg-[#0a0a0a] text-white",
    contentContainer: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
    formCard: "bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] rounded-lg overflow-hidden",
    stepIndicator: {
      wrapper: "px-8 py-6 border-b border-[#222222]",
    },
    formContent: "px-8 py-8",
    formActions: "px-8 py-6 border-t border-[#222222] flex justify-end gap-3",
  },

  // Status badges
  badge: {
    success: "bg-green-500/20 text-green-500 border border-green-500/30 px-2 py-0.5 rounded text-xs",
    warning: "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded text-xs",
    error: "bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-xs",
    info: "bg-blue-500/20 text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded text-xs",
  },

  // Summary cards (seen in account management)
  summaryCard: {
    container: "bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222] rounded-lg p-5",
    label: "text-sm text-gray-400 mb-1",
    value: "text-3xl font-bold",
    activeContainer: "border-[#b4a0ff] bg-gradient-to-br from-[#14121a] to-[#0a090e]",
  },
}

// -----------------------------------------------
// Spacing Patterns - Common spacing combinations
// -----------------------------------------------

export const spacingPatterns = {
  stackXs: "space-y-2",
  stackSm: "space-y-3",
  stackMd: "space-y-4",
  stackLg: "space-y-6",
  stackXl: "space-y-8",
  inlineXs: "space-x-2",
  inlineSm: "space-x-3",
  inlineMd: "space-x-4",
  inlineLg: "space-x-6",
  inlineXl: "space-x-8",
  gridGapXs: "gap-2",
  gridGapSm: "gap-3",
  gridGapMd: "gap-4",
  gridGapLg: "gap-6",
  gridGapXl: "gap-8",
}

// -----------------------------------------------
// Layout Constants - Common layout measurements
// -----------------------------------------------

export const layout = {
  maxWidth: "max-w-7xl",
  containerPadding: "px-4 sm:px-6 lg:px-8",
  sidebarWidth: "w-64",
  headerHeight: "h-16",
}

// -----------------------------------------------
// Breakpoints - For reference in responsive design
// -----------------------------------------------

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

// -----------------------------------------------
// Unified Design System Export
// -----------------------------------------------

export const designSystem = {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
  shadows,
  components,
  spacingPatterns,
  layout,
  animation,
  zIndex,
  breakpoints,
}

// -----------------------------------------------
// Helper Functions
// -----------------------------------------------

/**
 * Get a component style by path
 * @param path Path to the component style, e.g. 'button.variants.primary'
 * @returns The component style string or empty string if not found
 */
export function getComponentStyle(path: string): string {
  const parts = path.split(".")
  let result: any = components

  for (const part of parts) {
    if (result && result[part]) {
      result = result[part]
    } else {
      return ""
    }
  }

  return typeof result === "string" ? result : ""
}

/**
 * Combine multiple component styles
 * @param styles Array of component style paths
 * @returns Combined styles string
 */
export function combineStyles(...styles: string[]): string {
  return styles.filter(Boolean).join(" ")
}

// Example usage:
// const buttonStyle = combineStyles(
//   getComponentStyle('button.base'),
//   getComponentStyle('button.sizes.md'),
//   getComponentStyle('button.variants.primary')
// );
