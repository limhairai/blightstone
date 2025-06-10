import { componentPatterns } from "./component-patterns"
import { layoutTokens } from "./design-tokens"

// Quick access to most commonly used layout patterns
export const layout = {
  // Flex patterns (most common)
  flexBetween: componentPatterns.layout.flex.between, // "flex items-center justify-between"
  flexCenter: componentPatterns.layout.flex.center,   // "flex items-center justify-center"
  flexStart: componentPatterns.layout.flex.start,     // "flex items-center justify-start"
  flexEnd: componentPatterns.layout.flex.end,         // "flex items-center justify-end"
  flexColumn: componentPatterns.layout.flex.column,   // "flex flex-col"
  
  // Spacing patterns (most common)
  stackSmall: layoutTokens.spacing.tight,             // "space-y-1"
  stackMedium: layoutTokens.spacing.component,        // "space-y-3"
  stackLarge: layoutTokens.spacing.section,           // "space-y-4"
  
  // Grid patterns (most common)
  gridResponsive: componentPatterns.layout.grid.responsive, // "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  gridTwoCol: "grid grid-cols-1 md:grid-cols-2 gap-4",
  gridThreeCol: "grid grid-cols-1 md:grid-cols-3 gap-4",
  
  // Dashboard grid patterns (aligned with existing pages)
  walletGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6", // For wallet portfolio + funding panel
  businessGrid: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4", // For business cards
  metricsGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", // For metrics overview
  
  // Form patterns (most common)
  formFields: layoutTokens.spacing.formField,         // "space-y-2"
  formGroups: layoutTokens.spacing.section,           // "space-y-4"
  formTwoCol: componentPatterns.forms.layouts.twoColumn, // "grid grid-cols-1 md:grid-cols-2 gap-4"
  
  // Card patterns
  cardContent: componentPatterns.card.content,         // "space-y-4"
  cardHeader: componentPatterns.card.header.default,   // "flex items-center justify-between mb-4"
  
  // Page patterns (consistent with existing pages)
  pageContent: layoutTokens.spacing.container,         // "space-y-6" - main page wrapper
  pageContainer: layoutTokens.layouts.pageContainer,   // "space-y-6"
  
  // Section spacing (for consistent gaps between page sections)
  sectionGap: "mb-6", // Standard gap between major page sections
  
  // Common dashboard patterns
  dashboardHeader: "flex items-center justify-between mb-6", // Page header with title + actions
  dashboardSection: "space-y-4", // Standard section spacing
  
  // Table and list patterns
  tableSpacing: "space-y-1.5", // For compact table/list layouts
  cardGrid: "space-y-4", // For stacked cards
}

// Quick access to validation states
export const validation = {
  error: componentPatterns.forms.validation.error,
  success: componentPatterns.forms.validation.success,
  warning: componentPatterns.forms.validation.warning,
  default: componentPatterns.forms.validation.default,
}

// Quick access to status styles
export const status = {
  badge: {
    success: componentPatterns.status.badge.success,
    warning: componentPatterns.status.badge.warning,
    error: componentPatterns.status.badge.error,
    info: componentPatterns.status.badge.info,
    neutral: componentPatterns.status.badge.neutral,
  },
  dot: {
    success: componentPatterns.status.dot.success,
    warning: componentPatterns.status.dot.warning,
    error: componentPatterns.status.dot.error,
    info: componentPatterns.status.dot.info,
    neutral: componentPatterns.status.dot.neutral,
  }
} 