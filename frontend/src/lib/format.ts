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