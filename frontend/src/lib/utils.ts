import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getPageTitle(pathname: string): string {
  // Map of paths to their display titles
  const pathTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/wallet": "Wallet",
    "/dashboard/wallet/transactions": "Transactions",
    "/dashboard/accounts": "Accounts",
    "/dashboard/settings": "Settings",
  }

  // Check if we have a direct match for the path
  if (pathTitles[pathname]) {
    return pathTitles[pathname]
  }

  // If no direct match, try to find the closest parent path
  const segments = pathname.split("/").filter(Boolean)

  // Try to extract from the last path segment if no mapping exists
  const lastSegment = segments[segments.length - 1] || "dashboard"

  // Convert to title case (capitalize first letter)
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
}
