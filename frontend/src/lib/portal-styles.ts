/**
 * Utility to ensure CSS variables are available for portaled components
 * This fixes dropdown visibility issues in brief pages
 */

export function ensurePortalStyles() {
  // Check if styles are already injected
  if (document.getElementById('portal-styles')) {
    return
  }

  // Create style element with all necessary CSS variables
  const style = document.createElement('style')
  style.id = 'portal-styles'
  style.textContent = `
    /* Target all Radix portals and their content */
    [data-radix-portal],
    [data-radix-popper-content-wrapper],
    [data-radix-select-content],
    [data-radix-dropdown-menu-content],
    .radix-portal {
      --background: 0 0% 100% !important;
      --foreground: 0 0% 9% !important;
      --card: 0 0% 100% !important;
      --card-foreground: 0 0% 9% !important;
      --popover: 0 0% 100% !important;
      --popover-foreground: 0 0% 9% !important;
      --primary: 0 0% 9% !important;
      --primary-foreground: 0 0% 100% !important;
      --secondary: 0 0% 95% !important;
      --secondary-foreground: 0 0% 9% !important;
      --muted: 0 0% 96% !important;
      --muted-foreground: 0 0% 45% !important;
      --accent: 0 0% 96% !important;
      --accent-foreground: 0 0% 9% !important;
      --destructive: 0 0% 20% !important;
      --destructive-foreground: 0 0% 100% !important;
      --border: 0 0% 90% !important;
      --input: 0 0% 98% !important;
      --ring: 0 0% 9% !important;
    }

    /* Ensure all child elements also inherit these variables */
    [data-radix-portal] *,
    [data-radix-popper-content-wrapper] *,
    [data-radix-select-content] *,
    [data-radix-dropdown-menu-content] * {
      --background: inherit;
      --foreground: inherit;
      --popover: inherit;
      --popover-foreground: inherit;
      --border: inherit;
    }

    /* Force visibility and proper styling for dropdown content */
    [data-radix-select-content] {
      background: white !important;
      color: black !important;
      border: 1px solid #e5e5e5 !important;
      z-index: 99999 !important; /* Higher than brief page z-[9999] */
      pointer-events: auto !important; /* Ensure clicks work */
      opacity: 1 !important; /* Ensure it's visible */
      visibility: visible !important;
    }

    /* Also ensure other Radix portals have high z-index and can receive events */
    [data-radix-portal] {
      z-index: 99999 !important;
      pointer-events: auto !important;
    }

    /* Ensure SelectTrigger is clickable */
    [data-radix-select-trigger] {
      pointer-events: auto !important;
      cursor: pointer !important;
    }

    /* Force SelectItem visibility */
    [data-radix-select-item] {
      background: white !important;
      color: black !important;
      opacity: 1 !important;
      visibility: visible !important;
    }

    /* SelectItem hover state */
    [data-radix-select-item]:hover,
    [data-radix-select-item][data-highlighted] {
      background: #f5f5f5 !important;
      color: black !important;
    }
  `

  document.head.appendChild(style)
}