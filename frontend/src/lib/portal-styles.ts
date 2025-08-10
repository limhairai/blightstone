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
    /* Ensure all portaled components have access to CSS variables */
    [data-radix-popper-content-wrapper] {
      --background: 0 0% 100%;
      --foreground: 0 0% 9%;
      --card: 0 0% 100%;
      --card-foreground: 0 0% 9%;
      --popover: 0 0% 100%;
      --popover-foreground: 0 0% 9%;
      --primary: 0 0% 9%;
      --primary-foreground: 0 0% 100%;
      --secondary: 0 0% 95%;
      --secondary-foreground: 0 0% 9%;
      --muted: 0 0% 96%;
      --muted-foreground: 0 0% 45%;
      --accent: 0 0% 96%;
      --accent-foreground: 0 0% 9%;
      --destructive: 0 0% 20%;
      --destructive-foreground: 0 0% 100%;
      --border: 0 0% 90%;
      --input: 0 0% 98%;
      --ring: 0 0% 9%;
    }

    /* Also target common portal containers */
    [data-radix-portal] {
      --background: 0 0% 100%;
      --foreground: 0 0% 9%;
      --card: 0 0% 100%;
      --card-foreground: 0 0% 9%;
      --popover: 0 0% 100%;
      --popover-foreground: 0 0% 9%;
      --primary: 0 0% 9%;
      --primary-foreground: 0 0% 100%;
      --secondary: 0 0% 95%;
      --secondary-foreground: 0 0% 9%;
      --muted: 0 0% 96%;
      --muted-foreground: 0 0% 45%;
      --accent: 0 0% 96%;
      --accent-foreground: 0 0% 9%;
      --destructive: 0 0% 20%;
      --destructive-foreground: 0 0% 100%;
      --border: 0 0% 90%;
      --input: 0 0% 98%;
      --ring: 0 0% 9%;
    }
  `

  document.head.appendChild(style)
}