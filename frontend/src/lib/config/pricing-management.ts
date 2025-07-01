/**
 * Pricing Management System
 * Builds on top of the existing financial config for dynamic pricing
 */

import { DISPLAY_CONFIG } from './financial'

// Default fee rates since they're not in the secure financial config
const DEFAULT_FEE_RATES = {
  STARTER: 0.06,
  GROWTH: 0.03,
  SCALE: 0.015,
  ENTERPRISE: 0.01
}

// Pricing Plan Interface
export interface PricingPlan {
  id: string
  name: string
  description: string
  basePrice: number
  currency: string
  billingInterval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    dailySpend?: number
    monthlySpend?: number
    accountsLimit?: number
    usersLimit?: number
  }
  feeRate: number
  isActive: boolean
  isPopular?: boolean
  trialDays?: number
  setupFee?: number
  metadata?: Record<string, any>
}

// Dynamic Pricing Configuration
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    basePrice: 29,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      '1 Business Manager',
      '5 Ad Accounts',
      '2 Team Members',
      '6% ad spend fee'
    ],
    limits: {
      accountsLimit: 5,
      usersLimit: 2
    },
    feeRate: 0.06, // 6%
    isActive: true,
    trialDays: 0
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    basePrice: 149,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      '3 Business Managers',
      '21 Ad Accounts',
      '5 Team Members',
      '3% ad spend fee'
    ],
    limits: {
      accountsLimit: 21,
      usersLimit: 5
    },
    feeRate: 0.03, // 3%
    isActive: true,
    isPopular: true,
    trialDays: 0
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For scaling teams',
    basePrice: 499,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      '10 Business Managers',
      '70 Ad Accounts',
      '15 Team Members',
      '1.5% ad spend fee'
    ],
    limits: {
      accountsLimit: 70,
      usersLimit: 15
    },
    feeRate: 0.015, // 1.5%
    isActive: true,
    trialDays: 0
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    basePrice: 1499,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      'Unlimited Business Managers',
      'Unlimited Ad Accounts',
      'Unlimited Team Members',
      '1% ad spend fee'
    ],
    limits: {
      accountsLimit: -1, // unlimited
      usersLimit: -1 // unlimited
    },
    feeRate: 0.01, // 1%
    isActive: true,
    trialDays: 0
  }
]

// Pricing Management Functions
export const getPricingPlan = (planId: string): PricingPlan | undefined => {
  return PRICING_PLANS.find(plan => plan.id === planId && plan.isActive)
}

export const getActivePricingPlans = (): PricingPlan[] => {
  return PRICING_PLANS.filter(plan => plan.isActive)
}

export const calculateAnnualDiscount = (monthlyPrice: number, discountRate: number = 0.15): number => {
  const annualPrice = monthlyPrice * 12
  const discountAmount = annualPrice * discountRate
  return annualPrice - discountAmount
}

export const calculateTotalCost = (
  plan: PricingPlan,
  isAnnual: boolean = false,
  additionalFees: number = 0
): number => {
  let totalCost = plan.basePrice + additionalFees
  
  if (plan.setupFee) {
    totalCost += plan.setupFee
  }
  
  if (isAnnual) {
    totalCost = calculateAnnualDiscount(totalCost)
  }
  
  return totalCost
}

// Feature Access Control
export const hasFeatureAccess = (
  userPlan: string,
  requiredFeature: string
): boolean => {
  const plan = getPricingPlan(userPlan)
  return plan?.features.includes(requiredFeature) || false
}

export const checkSpendLimit = (
  userPlan: string,
  currentSpend: number,
  period: 'daily' | 'monthly'
): { allowed: boolean; limit: number; remaining: number } => {
  const plan = getPricingPlan(userPlan)
  
  if (!plan) {
    return { allowed: false, limit: 0, remaining: 0 }
  }
  
  const limit = period === 'daily' 
    ? plan.limits.dailySpend || 0
    : plan.limits.monthlySpend || 0
  
  const remaining = Math.max(0, limit - currentSpend)
  const allowed = currentSpend < limit
  
  return { allowed, limit, remaining }
}

// Pricing Experiments (A/B Testing)
export interface PricingExperiment {
  id: string
  name: string
  isActive: boolean
  variants: {
    control: PricingPlan[]
    treatment: PricingPlan[]
  }
  allocation: number // 0-1, percentage for treatment
}

export const getPricingForUser = (
  userId: string,
  experiment?: PricingExperiment
): PricingPlan[] => {
  // Simple hash-based assignment for A/B testing
  if (experiment?.isActive) {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const assignment = Math.abs(hash) % 100 / 100
    
    if (assignment < experiment.allocation) {
      return experiment.variants.treatment
    }
  }
  
  return getActivePricingPlans()
}

// Admin Functions (for future pricing management dashboard)
export const updatePricingPlan = (planId: string, updates: Partial<PricingPlan>): boolean => {
  // In a real implementation, this would update the database
  // For now, this is a placeholder for the admin interface

  return true
}

export const createPricingExperiment = (experiment: PricingExperiment): boolean => {
  // Placeholder for creating pricing experiments

  return true
}

// Environment-based pricing overrides
export const getEnvironmentPricing = (): Partial<PricingPlan> => {
  const overrides: Partial<PricingPlan> = {}
  
  // Allow environment variables to override pricing
  if (process.env.NEXT_PUBLIC_PRICING_OVERRIDE_BASIC) {
    overrides.basePrice = parseInt(process.env.NEXT_PUBLIC_PRICING_OVERRIDE_BASIC)
  }
  
  if (process.env.NEXT_PUBLIC_PRICING_TRIAL_DAYS) {
    overrides.trialDays = parseInt(process.env.NEXT_PUBLIC_PRICING_TRIAL_DAYS)
  }
  
  return overrides
} 