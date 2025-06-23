/**
 * Financial Calculations Tests
 * Tests all money-related logic without real payments
 */

import { describe, it, expect } from '@jest/globals'

// Financial utility functions (these would be in your actual lib)
export const calculateAdSpendFees = (spendAmount: number, feePercentage: number): number => {
  return Math.round(spendAmount * feePercentage * 100) / 100
}

export const calculateRemainingBudget = (
  totalLimit: number,
  amountSpent: number,
  feePercentage: number = 0
): number => {
  const feeAmount = calculateAdSpendFees(totalLimit, feePercentage)
  const availableForSpend = totalLimit - feeAmount
  return Math.max(0, availableForSpend - amountSpent)
}

export const calculateWalletBalance = (
  currentBalance: number,
  topUpAmount: number,
  processingFee: number = 0
): number => {
  const netTopUp = topUpAmount - processingFee
  return currentBalance + netTopUp
}

export const validateSpendLimit = (
  requestedSpend: number,
  availableBudget: number,
  minimumSpend: number = 1
): { valid: boolean; message?: string } => {
  if (requestedSpend < minimumSpend) {
    return { valid: false, message: `Minimum spend is $${minimumSpend}` }
  }
  
  if (requestedSpend > availableBudget) {
    return { valid: false, message: `Insufficient budget. Available: $${availableBudget}` }
  }
  
  return { valid: true }
}

describe('Financial Calculations', () => {
  describe('Fee Calculations', () => {
    it('should calculate 5% fee correctly', () => {
      expect(calculateAdSpendFees(1000, 0.05)).toBe(50)
      expect(calculateAdSpendFees(2500, 0.05)).toBe(125)
      expect(calculateAdSpendFees(100, 0.05)).toBe(5)
    })

    it('should handle different fee percentages', () => {
      expect(calculateAdSpendFees(1000, 0.03)).toBe(30) // 3%
      expect(calculateAdSpendFees(1000, 0.1)).toBe(100) // 10%
      expect(calculateAdSpendFees(1000, 0)).toBe(0) // No fee
    })

    it('should round to 2 decimal places', () => {
      expect(calculateAdSpendFees(333.33, 0.05)).toBe(16.67)
      expect(calculateAdSpendFees(123.45, 0.03)).toBe(3.7)
    })
  })

  describe('Budget Calculations', () => {
    it('should calculate remaining budget with fees', () => {
      // $5000 limit, $1200 spent, 5% fee
      // Available for spend: $5000 - $250 (fee) = $4750
      // Remaining: $4750 - $1200 = $3550
      expect(calculateRemainingBudget(5000, 1200, 0.05)).toBe(3550)
    })

    it('should handle no fees', () => {
      expect(calculateRemainingBudget(1000, 300, 0)).toBe(700)
      expect(calculateRemainingBudget(1000, 950, 0)).toBe(50)
    })

    it('should not go below zero', () => {
      expect(calculateRemainingBudget(1000, 1200, 0)).toBe(0)
      expect(calculateRemainingBudget(1000, 800, 0.3)).toBe(0) // High fee scenario
    })
  })

  describe('Wallet Operations', () => {
    it('should calculate new balance after top-up', () => {
      expect(calculateWalletBalance(1000, 500, 0)).toBe(1500)
      expect(calculateWalletBalance(250, 750, 0)).toBe(1000)
    })

    it('should account for processing fees', () => {
      // $500 top-up with $15 processing fee
      expect(calculateWalletBalance(1000, 500, 15)).toBe(1485)
      
      // $100 top-up with $3 processing fee
      expect(calculateWalletBalance(200, 100, 3)).toBe(297)
    })

    it('should handle edge cases', () => {
      expect(calculateWalletBalance(0, 100, 0)).toBe(100) // First top-up
      expect(calculateWalletBalance(50, 0, 0)).toBe(50) // No top-up
    })
  })

  describe('Spend Validation', () => {
    it('should validate normal spend requests', () => {
      const result = validateSpendLimit(500, 1000)
      expect(result.valid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should reject spend below minimum', () => {
      const result = validateSpendLimit(0.5, 1000, 1)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Minimum spend is $1')
    })

    it('should reject spend above budget', () => {
      const result = validateSpendLimit(1500, 1000)
      expect(result.valid).toBe(false)
      expect(result.message).toBe('Insufficient budget. Available: $1000')
    })

    it('should handle exact budget match', () => {
      const result = validateSpendLimit(1000, 1000)
      expect(result.valid).toBe(true)
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle TechCorp example', () => {
      const totalLimit = 5000
      const feePercentage = 0.05
      const currentSpend = 1200
      
      // Calculate what client sees
      const remainingBudget = calculateRemainingBudget(totalLimit, currentSpend, feePercentage)
      const feeAmount = calculateAdSpendFees(totalLimit, feePercentage)
      
      expect(remainingBudget).toBe(3550)
      expect(feeAmount).toBe(250)
      
      // Validate they can spend within remaining budget
      const spendValidation = validateSpendLimit(500, remainingBudget)
      expect(spendValidation.valid).toBe(true)
      
      // But not more than remaining
      const overspendValidation = validateSpendLimit(4000, remainingBudget)
      expect(overspendValidation.valid).toBe(false)
    })

    it('should handle wallet top-up for ad spend', () => {
      let walletBalance = 800
      const requiredSpend = 1200
      const topUpNeeded = requiredSpend - walletBalance
      
      // Client needs to top up $400
      expect(topUpNeeded).toBe(400)
      
      // After top-up (with $12 processing fee)
      walletBalance = calculateWalletBalance(walletBalance, 500, 12)
      expect(walletBalance).toBe(1288)
      
      // Now they can afford the spend
      const canAfford = walletBalance >= requiredSpend
      expect(canAfford).toBe(true)
    })

    it('should calculate monthly budget tracking', () => {
      const monthlyLimit = 10000
      const dailySpends = [150, 200, 175, 300, 250] // 5 days
      const totalSpent = dailySpends.reduce((sum, spend) => sum + spend, 0)
      
      expect(totalSpent).toBe(1075)
      
      const remaining = calculateRemainingBudget(monthlyLimit, totalSpent, 0.05)
      expect(remaining).toBe(8425) // $10k - $500 fee - $1075 spent
      
      // Average daily spend
      const avgDailySpend = totalSpent / dailySpends.length
      expect(avgDailySpend).toBe(215)
      
      // Projected monthly spend
      const projectedMonthly = avgDailySpend * 30
      expect(projectedMonthly).toBe(6450)
      
      // Should be within budget
      expect(projectedMonthly < remaining).toBe(true)
    })
  })
}) 