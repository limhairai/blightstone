import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Class name utilities
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatting utilities
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

export function formatNumber(number: number): string {
  return number.toLocaleString('en-US')
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`
}

// Time and greeting utilities
export function getGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Good morning"
  } else if (hour < 17) {
    return "Good afternoon"
  } else {
    return "Good evening"
  }
}

export function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 1 && segments[0] === "dashboard") {
    return "Dashboard"
  }

  if (segments.length >= 2) {
    const pageSegment = segments[segments.length - 1]
    return pageSegment.charAt(0).toUpperCase() + pageSegment.slice(1)
  }

  return "Dashboard"
}

// String utilities
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
