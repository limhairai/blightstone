/**
 * 🔒 SECURE Financial Configuration System
 * 
 * This replaces the insecure financial.ts file that exposed all financial
 * business logic to client-side manipulation.
 */

// ✅ SECURE: Client-side display configuration only
export const DISPLAY_CONFIG = {
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  DECIMAL_PLACES: 2,
  UI_MIN_AMOUNT: 1,
  UI_MAX_DISPLAY: 999999,
}

// ✅ SECURE: Financial utility functions (display only)
export const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${DISPLAY_CONFIG.CURRENCY_SYMBOL}0.00`
  }
  
  return `${DISPLAY_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: DISPLAY_CONFIG.DECIMAL_PLACES 
  })}`
}

export const parseAmount = (amountString: string): number => {
  const cleaned = amountString.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export const formatPercentage = (rate: number): string => {
  return `${(rate * 100).toFixed(1)}%`
}

// ✅ SECURE: Demo data for development (clearly marked as demo)
export const DEMO_DISPLAY_DATA = {
  demoWalletBalance: 15420,
  demoAccountBalance: 4250,
  demoSpendLimit: 5000,
  demoFeeRate: 0.05,
}

// ✅ SECURE: Client-side validation (UX only, not security)
export const validateAmountFormat = (amount: string): { valid: boolean; message?: string } => {
  const parsed = parseAmount(amount)
  
  if (parsed <= 0) {
    return { valid: false, message: 'Amount must be greater than 0' }
  }
  
  if (parsed > DISPLAY_CONFIG.UI_MAX_DISPLAY) {
    return { valid: false, message: 'Amount too large for display' }
  }
  
  return { valid: true }
}

// 🚨 SECURITY WARNING
export const SECURITY_WARNING = `
🚨 CRITICAL SECURITY NOTICE 🚨

The previous financial.ts file exposed ALL financial business logic to client-side.
This secure implementation moves all financial logic server-side.

NEVER expose financial business logic to client-side code!
`

if (process.env.NODE_ENV === 'development') {
  console.warn(SECURITY_WARNING)
}
