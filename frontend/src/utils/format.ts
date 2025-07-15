// Utility functions for formatting (production-ready)

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null || !Number.isFinite(amount)) return '$0.00'
  return new Intl.NumberFormat("en-US", {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatRelativeTime(timestamp: Date | string | null | undefined): string {
  // Handle null/undefined timestamps
  if (!timestamp) return 'Unknown time'
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  
  // Check if date is valid
  if (!date || isNaN(date.getTime())) return 'Invalid date'
  
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInHours < 24) return `${diffInHours} hours ago`
  if (diffInDays < 7) return `${diffInDays} days ago`
  
  return date.toLocaleDateString()
}

export function getInitials(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') {
    return 'N/A';
  }
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Transaction colors for different types with background and icon styles
export const transactionColors = {
  deposit: {
    bg: 'bg-green-100',
    icon: 'text-green-600'
  },
  withdrawal: {
    bg: 'bg-red-100', 
    icon: 'text-red-600'
  },
  topup: {
    bg: 'bg-green-100',
    icon: 'text-green-600'
  },
  spend: {
    bg: 'bg-orange-100',
    icon: 'text-orange-600'
  },
  transfer: {
    bg: 'bg-blue-100',
    icon: 'text-blue-600'
  }
}

// Empty arrays for backward compatibility (will be replaced with real data from context)
export const APP_BUSINESSES: any[] = []
export const APP_ACCOUNTS: any[] = []
export const APP_TRANSACTIONS: any[] = []

// This function should now get data from the app context instead of mock data
export function getTotalAccountsBalance(): number {
  // TODO: Get accounts from useAppData context instead of mock data
  return 0
}
