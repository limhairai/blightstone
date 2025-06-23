/**
 * Pricing Management System
 * Builds on top of the existing financial config for dynamic pricing
 */

import { DISPLAY_CONFIG } from './financial'

// Default fee rates since they're not in the secure financial config
const DEFAULT_FEE_RATES = {
  FREE: 0.05,
  BASIC: 0.04,
  PRO: 0.03,
  ENTERPRISE: 0.02
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
    id: 'free',
    name: 'Free',
    description: 'Perfect for testing and small projects',
    basePrice: 0,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      'Up to 2 ad accounts',
      'Basic dashboard',
      'Email support',
      '$1,000 monthly spend limit'
    ],
    limits: {
      dailySpend: 100,
      monthlySpend: 1000,
      accountsLimit: 2,
      usersLimit: 1
    },
    feeRate: DEFAULT_FEE_RATES.FREE,
    isActive: true,
    trialDays: 0
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For growing businesses',
    basePrice: 299,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      'Up to 10 ad accounts',
      'Advanced analytics',
      'Priority email support',
      '$30,000 monthly spend limit',
      'Team collaboration'
    ],
    limits: {
      dailySpend: 3000,
      monthlySpend: 30000,
      accountsLimit: 10,
      usersLimit: 5
    },
    feeRate: DEFAULT_FEE_RATES.BASIC,
    isActive: true,
    isPopular: true,
    trialDays: 14
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For scaling teams',
    basePrice: 799,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      'Unlimited ad accounts',
      'Advanced automation',
      'Phone + chat support',
      '$100,000 monthly spend limit',
      'Advanced team features',
      'Custom integrations'
    ],
    limits: {
      dailySpend: 10000,
      monthlySpend: 100000,
      accountsLimit: -1, // unlimited
      usersLimit: 25
    },
    feeRate: DEFAULT_FEE_RATES.PRO,
    isActive: true,
    trialDays: 14
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    basePrice: 2499,
    currency: DISPLAY_CONFIG.CURRENCY,
    billingInterval: 'monthly',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom spend limits',
      'SLA guarantees',
      'Advanced security',
      'Custom contracts'
    ],
    limits: {
      dailySpend: 50000,
      monthlySpend: 300000,
      accountsLimit: -1,
      usersLimit: -1 // unlimited
    },
    feeRate: DEFAULT_FEE_RATES.ENTERPRISE,
    isActive: true,
    trialDays: 30
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
  console.log(`Updating plan ${planId} with:`, updates)
  return true
}

export const createPricingExperiment = (experiment: PricingExperiment): boolean => {
  // Placeholder for creating pricing experiments
  console.log('Creating pricing experiment:', experiment)
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