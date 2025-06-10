// AdHub Design System
// Comprehensive design tokens and styling guidelines for the application

import { gradientTokens } from './design-tokens'

// Base Tokens - Primitive values - REMOVED as these are now sourced from Tailwind theme 
// (which is configured by design-tokens.ts and globals.css)

// export const colors = { ... } // REMOVED
// export const spacing = { ... } // REMOVED
// export const typography = { ... } // REMOVED
// export const borderRadius = { ... } // REMOVED
// export const shadows = { ... } // REMOVED
// export const zIndex = { ... } // REMOVED

export const gradients = {
  primary: gradientTokens.primary,
  cardGradient: "bg-gradient-to-br from-[hsl(var(--card))] to-[#0a0a0a]",
  subtleCardGradient: "bg-gradient-to-br from-[#141414] to-[#0c0c0c]",
  darkGradient: "bg-gradient-to-br from-[#0c0c0c] to-[#050505]",
}

export const animation = {
  default: "transition-all duration-normal ease-easeInOut",
  slow: "transition-all duration-slow ease-easeInOut",
  fast: "transition-all duration-fast ease-easeInOut",
}

// -----------------------------------------------
// Composite Tokens - Component-specific styling
// -----------------------------------------------

export const components = {
  // Dialog and card styling
  dialog: {
    container: `${gradients.cardGradient} border border-border rounded-lg shadow-lg overflow-hidden`,
    header: "px-8 py-6 border-b border-border",
    body: "px-8 py-8",
    footer: "px-8 py-6 border-t border-border",
  },

  card: {
    container: `${gradients.cardGradient} border border-border rounded-lg`,
    compact: "p-5",
    normal: "p-6",
    spacious: "p-8",
    interactive: "hover:border-ring transition-colors duration-normal",
    selected: "border-primary bg-background",
  },

  // Button variants
  button: {
    base: "font-medium rounded transition-all duration-normal",
    sizes: {
      sm: "px-3 py-1 h-8 text-xs",
      md: "px-4 py-1.5 h-9 text-sm",
      lg: "px-5 py-2 h-10 text-base",
    },
    variants: {
      primary: `${gradients.primary} text-primary-foreground hover:opacity-90`,
      secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
      outline: "bg-transparent border border-border text-foreground hover:bg-muted hover:border-secondary",
      ghost: "bg-transparent text-foreground hover:bg-muted",
    },
  },

  // Form elements
  form: {
    label: "block text-xs font-medium text-muted-foreground mb-1.5",
    input:
      "w-full bg-card border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
    select:
      "w-full bg-card border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary",
    checkbox: "h-4 w-4 rounded border-input text-primary focus:ring-ring focus:ring-offset-background",
    helpText: "mt-1 text-xs text-muted-foreground",
    error: "mt-1 text-xs text-destructive",
  },

  // Progress indicators
  progress: {
    container: "flex justify-between items-center relative",
    track: "absolute top-5 left-0 right-0 h-[1px] bg-border",
    indicator:
      `absolute top-5 left-0 right-0 h-[1px] ${gradients.primary} transition-all duration-slow ease-easeInOut`,
    step: {
      container: "flex flex-col items-center z-10",
      circle: {
        base: "w-10 h-10 rounded-full flex items-center justify-center",
        active: gradients.primary,
        inactive: "bg-muted",
        completed: gradients.primary,
      },
      label: {
        base: "mt-2 text-xs font-medium",
        active: "text-foreground",
        inactive: "text-muted-foreground",
      },
    },
  },

  // Layout elements
  layout: {
    header: "border-b border-border py-4",
    pageTitle: "text-2xl font-medium text-foreground text-center mb-2",
    pageSubtitle: "text-sm text-muted-foreground text-center mb-8",
    sectionTitle: "text-xl font-medium text-foreground mb-6",
    subsectionTitle: "text-sm font-medium mb-4 text-primary",
  },

  // Application forms
  application: {
    pageWrapper: "min-h-screen bg-background text-foreground",
    contentContainer: "max-w-3xl mx-auto py-8 px-4 sm:px-6",
    formCard: `${gradients.cardGradient} border border-border rounded-lg overflow-hidden`,
    stepIndicator: {
      wrapper: "px-8 py-6 border-b border-border",
    },
    formContent: "px-8 py-8",
    formActions: "px-8 py-6 border-t border-border flex justify-end gap-3",
  },

  // Status badges
  badge: {
    success: "status-active px-2 py-0.5 rounded-sm text-xs",
    warning: "status-pending px-2 py-0.5 rounded-sm text-xs",
    error: "status-failed px-2 py-0.5 rounded-sm text-xs",
    info: "bg-accent text-accent-foreground border-accent px-2 py-0.5 rounded-sm text-xs",
  },

  // Summary cards (seen in account management)
  summaryCard: {
    container: `${gradients.cardGradient} border border-border rounded-lg p-5`,
    label: "text-sm text-muted-foreground mb-1",
    value: "text-3xl font-bold",
    activeContainer: "border-primary bg-gradient-to-br from-[#14121a] to-[#0a090e]",
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
  gradients,
  animation,
  components,
  spacingPatterns,
  layout,
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