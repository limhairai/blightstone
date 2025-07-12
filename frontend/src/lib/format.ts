/**
 * Format currency amounts with proper locale and currency symbols
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  fromCents: boolean = false
): string {
  const value = fromCents ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format dates consistently across the application
 */
export function formatDate(
  date: Date, 
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  let options: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'short':
      options = { month: 'numeric', day: 'numeric', year: 'numeric' };
      break;
    case 'medium':
      options = { month: 'short', day: 'numeric', year: 'numeric' };
      break;
    case 'long':
      options = { month: 'long', day: 'numeric', year: 'numeric' };
      break;
    default:
      options = { month: 'short', day: 'numeric', year: 'numeric' };
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number, 
  decimals: number = 2
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format file sizes in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // For bytes, don't show decimals
  if (i === 0) {
    return `${bytes} ${sizes[i]}`;
  }
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format phone numbers
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}

/**
 * Format time duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
} 