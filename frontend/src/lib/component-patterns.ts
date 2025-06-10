// Component patterns for consistent UI behavior across the application
export const componentPatterns = {
  // Form patterns
  forms: {
    // Standard form field spacing
    fieldSpacing: "space-y-4",
    fieldGroupSpacing: "space-y-6",
    
    // Form validation states
    validation: {
      error: "border-destructive focus:border-destructive",
      success: "border-green-500 focus:border-green-500",
      warning: "border-yellow-500 focus:border-yellow-500",
      default: "border-border focus:border-primary",
    },
    
    // Form layouts
    layouts: {
      singleColumn: "space-y-4",
      twoColumn: "grid grid-cols-1 md:grid-cols-2 gap-4",
      threeColumn: "grid grid-cols-1 md:grid-cols-3 gap-4",
      inline: "flex items-center gap-4",
    },
  },

  // Loading patterns
  loading: {
    // Skeleton loaders
    skeleton: {
      text: "h-4 bg-muted rounded animate-pulse",
      title: "h-6 bg-muted rounded animate-pulse",
      avatar: "h-10 w-10 bg-muted rounded-full animate-pulse",
      button: "h-9 w-20 bg-muted rounded animate-pulse",
      card: "h-32 bg-muted rounded animate-pulse",
    },
    
    // Spinner sizes
    spinner: {
      small: "h-4 w-4",
      medium: "h-6 w-6", 
      large: "h-8 w-8",
    },
  },

  // Empty state patterns
  empty: {
    // Container styles
    container: "flex flex-col items-center justify-center py-16 text-center",
    
    // Icon styles
    icon: "h-12 w-12 text-muted-foreground mb-4",
    
    // Text styles
    title: "text-lg font-medium text-foreground mb-2",
    description: "text-sm text-muted-foreground mb-4",
    
    // Action button
    action: "mt-4",
  },

  // Error state patterns
  error: {
    // Error boundary styles
    container: "flex flex-col items-center justify-center py-16 text-center",
    icon: "h-12 w-12 text-destructive mb-4",
    title: "text-lg font-medium text-foreground mb-2",
    description: "text-sm text-muted-foreground mb-4",
    actions: "flex gap-2 mt-4",
  },

  // Modal/Dialog patterns
  modal: {
    // Size variants
    sizes: {
      small: "max-w-md",
      medium: "max-w-lg", 
      large: "max-w-2xl",
      extraLarge: "max-w-4xl",
      fullWidth: "max-w-7xl",
    },
    
    // Content spacing
    content: "space-y-4",
    
    // Footer layouts
    footer: {
      single: "flex justify-end",
      split: "flex justify-between",
      center: "flex justify-center",
      actions: "flex justify-end gap-2",
    },
  },

  // Card patterns
  card: {
    // Padding variants
    padding: {
      none: "p-0",
      small: "p-3",
      medium: "p-4",
      large: "p-6",
    },
    
    // Header styles
    header: {
      default: "flex items-center justify-between mb-4",
      withDescription: "mb-6",
    },
    
    // Content spacing
    content: "space-y-4",
  },

  // Table patterns
  table: {
    // Row heights
    rowHeight: {
      compact: "py-2",
      comfortable: "py-3", 
      spacious: "py-4",
    },
    
    // Header styles
    header: "bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide",
    
    // Cell alignment
    cell: {
      left: "text-left",
      center: "text-center", 
      right: "text-right",
    },
    
    // Hover states
    hover: "hover:bg-muted/50 transition-colors",
  },

  // Button patterns
  button: {
    // Size combinations with icons
    withIcon: {
      small: "h-7 px-2 text-xs",
      medium: "h-9 px-3 text-sm",
      large: "h-11 px-4 text-base",
    },
    
    // Loading states
    loading: "opacity-50 cursor-not-allowed",
    
    // Icon spacing
    iconSpacing: {
      left: "mr-2",
      right: "ml-2",
    },
  },

  // Navigation patterns
  navigation: {
    // Sidebar styles
    sidebar: {
      width: "w-64",
      collapsed: "w-16",
      item: "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
      activeItem: "bg-accent text-accent-foreground",
      inactiveItem: "text-muted-foreground hover:text-foreground hover:bg-accent/50",
    },
    
    // Breadcrumb styles
    breadcrumb: {
      container: "flex items-center space-x-2 text-sm",
      item: "text-muted-foreground hover:text-foreground",
      separator: "text-muted-foreground",
      current: "text-foreground font-medium",
    },
    
    // Tab styles
    tabs: {
      container: "border-b border-border",
      item: "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
      active: "border-primary text-primary",
      inactive: "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
    },
  },

  // Status patterns
  status: {
    // Badge variants
    badge: {
      success: "bg-green-100 text-green-800 border-green-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      error: "bg-red-100 text-red-800 border-red-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
    },
    
    // Dot indicators
    dot: {
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500", 
      info: "bg-blue-500",
      neutral: "bg-gray-500",
    },
  },

  // Animation patterns
  animation: {
    // Entrance animations
    fadeIn: "animate-in fade-in duration-200",
    slideIn: "animate-in slide-in-from-bottom-4 duration-200",
    scaleIn: "animate-in zoom-in-95 duration-200",
    
    // Exit animations
    fadeOut: "animate-out fade-out duration-150",
    slideOut: "animate-out slide-out-to-bottom-4 duration-150",
    scaleOut: "animate-out zoom-out-95 duration-150",
    
    // Hover animations
    hover: "transition-all duration-200 ease-in-out",
    hoverScale: "hover:scale-105 transition-transform duration-200",
    hoverLift: "hover:shadow-lg transition-shadow duration-200",
  },

  // Layout patterns
  layout: {
    // Page containers
    page: "min-h-screen bg-background",
    content: "flex-1 overflow-y-auto",
    
    // Grid patterns
    grid: {
      responsive: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
      autoFit: "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4",
      sidebar: "grid grid-cols-1 lg:grid-cols-4 gap-6",
    },
    
    // Flex patterns
    flex: {
      between: "flex items-center justify-between",
      center: "flex items-center justify-center",
      start: "flex items-center justify-start",
      end: "flex items-center justify-end",
      column: "flex flex-col",
      wrap: "flex flex-wrap",
    },
  },
}

// Utility functions for component patterns
export const getFormValidationClass = (state: 'error' | 'success' | 'warning' | 'default') => {
  return componentPatterns.forms.validation[state]
}

export const getStatusBadgeClass = (status: 'success' | 'warning' | 'error' | 'info' | 'neutral') => {
  return componentPatterns.status.badge[status]
}

export const getStatusDotClass = (status: 'success' | 'warning' | 'error' | 'info' | 'neutral') => {
  return componentPatterns.status.dot[status]
} 