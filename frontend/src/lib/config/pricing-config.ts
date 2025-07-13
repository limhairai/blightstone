// Pricing Configuration with Feature Flags
export interface PricingConfig {
  // Feature flags
  enableTopupLimits: boolean;
  enableAdSpendFees: boolean;
  enableDomainLimits: boolean;
  enableTeamLimits: boolean;
  enablePixelLimits: boolean; // Changed from enablePromotionUrlLimits
  enableBmApplicationFees: boolean; // Keep for backward compatibility but set to false
  
  // New pricing model
  newPricingModel: {
    enabled: boolean;
    plans: {
      starter: {
        price: number;
        businessManagers: number; // Active BM limit
        adAccounts: number; // Active ad account limit (pool)
        pixels: number; // Facebook pixel limit
        adSpendFee: number;
        unlimitedReplacements: boolean;
      };
      growth: {
        price: number;
        businessManagers: number; // Active BM limit
        adAccounts: number; // Active ad account limit (pool)
        pixels: number; // Facebook pixel limit
        adSpendFee: number;
        unlimitedReplacements: boolean;
      };
      scale: {
        price: number;
        businessManagers: number; // Active BM limit
        adAccounts: number; // Active ad account limit (pool)
        pixels: number; // Facebook pixel limit
        adSpendFee: number;
        unlimitedReplacements: boolean;
      };
    };
  };
}

// Current pricing configuration
export const PRICING_CONFIG: PricingConfig = {
  // Feature flags - set to false to disable old features
  enableTopupLimits: false,
  enableAdSpendFees: true, // Enable 1% ad spend fee
  enableDomainLimits: false,
  enableTeamLimits: false,
  enablePixelLimits: true, // Enable pixel limits
  enableBmApplicationFees: false, // Disable BM application fees
  
  // New pricing model
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 79,
        businessManagers: 3, // Max 3 active BMs
        adAccounts: 10, // Max 10 active ad accounts (pool)
        pixels: 2, // 2 Facebook pixels
        adSpendFee: 1, // 1% ad spend fee
        unlimitedReplacements: true,
      },
      growth: {
        price: 299,
        businessManagers: 5, // Max 5 active BMs
        adAccounts: 25, // Max 25 active ad accounts (pool)
        pixels: 5, // 5 Facebook pixels
        adSpendFee: 1, // 1% ad spend fee
        unlimitedReplacements: true,
      },
      scale: {
        price: 799,
        businessManagers: 15, // Max 15 active BMs
        adAccounts: 75, // Max 75 active ad accounts (pool)
        pixels: 10, // 10 Facebook pixels
        adSpendFee: 1, // 1% ad spend fee
        unlimitedReplacements: true,
      },
    },
  },
};

// Helper functions
export const shouldEnableTopupLimits = () => PRICING_CONFIG.enableTopupLimits;
export const shouldEnableAdSpendFees = () => PRICING_CONFIG.enableAdSpendFees;
export const shouldEnableDomainLimits = () => PRICING_CONFIG.enableDomainLimits;
export const shouldEnableTeamLimits = () => PRICING_CONFIG.enableTeamLimits;
export const shouldEnablePixelLimits = () => PRICING_CONFIG.enablePixelLimits;
export const shouldEnableBmApplicationFees = () => PRICING_CONFIG.enableBmApplicationFees;
export const isNewPricingEnabled = () => PRICING_CONFIG.newPricingModel.enabled;

// Get pricing for a specific plan
export const getPlanPricing = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId];
  }
  return null;
};

// Get pixel limit for a plan
export const getPixelLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnablePixelLimits() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].pixels;
  }
  return null; // No limit if feature disabled
};

// Get active BM limit for a plan
export const getActiveBmLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].businessManagers;
  }
  return null;
};

// Get active ad account limit for a plan (pool limit)
export const getActiveAdAccountLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].adAccounts;
  }
  return null;
};

// Calculate maximum possible ad accounts based on BM limit
// Each BM can host max 5 ad accounts due to provider limit (7 total - 2 buffer)
export const getMaxPossibleAdAccounts = (planId: 'starter' | 'growth' | 'scale') => {
  const bmLimit = getActiveBmLimit(planId);
  if (!bmLimit) return null;
  
  // Each BM can host 5 ad accounts max
  return bmLimit * 5;
};

// Check if ad account limit exceeds BM capacity
export const validateAdAccountLimits = (planId: 'starter' | 'growth' | 'scale') => {
  const adAccountLimit = getActiveAdAccountLimit(planId);
  const maxPossible = getMaxPossibleAdAccounts(planId);
  
  if (!adAccountLimit || !maxPossible) return true;
  
  return adAccountLimit <= maxPossible;
}; 