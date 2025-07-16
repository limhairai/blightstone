// Pricing Configuration with Feature Flags
export interface PricingConfig {
  // Feature flags
  enableTopupLimits: boolean;
  enableAdSpendFees: boolean;
  enableDomainLimits: boolean;
  enableTeamLimits: boolean;
  enablePixelLimits: boolean;
  enableBmApplicationFees: boolean;
  
  // New pricing model
  newPricingModel: {
    enabled: boolean;
    plans: {
      starter: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        pixels: number;
        domainsPerBm: number;
        adSpendFee: number;
        spendFeeCap: number;
        monthlyTopupLimit: number;
        unlimitedReplacements: boolean;
      };
      growth: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        pixels: number;
        domainsPerBm: number;
        adSpendFee: number;
        spendFeeCap: number;
        monthlyTopupLimit: number;
        unlimitedReplacements: boolean;
      };
      scale: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        pixels: number;
        domainsPerBm: number;
        adSpendFee: number;
        spendFeeCap: number;
        monthlyTopupLimit: number;
        unlimitedReplacements: boolean;
      };
    };
  };
}

// Current pricing configuration
export const PRICING_CONFIG: PricingConfig = {
  // Feature flags - enable new model features
  enableTopupLimits: true,
  enableAdSpendFees: true,
  enableDomainLimits: true,
  enableTeamLimits: false,
  enablePixelLimits: true,
  enableBmApplicationFees: false,
  
  // New pricing model - launch configuration
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 79,
        businessManagers: 1,
        adAccounts: 10,
        pixels: 2,
        domainsPerBm: 2,
        adSpendFee: 1.25,
        spendFeeCap: 149,
        monthlyTopupLimit: 10000,
        unlimitedReplacements: true,
      },
      growth: {
        price: 299,
        businessManagers: 3,
        adAccounts: 20,
        pixels: 5,
        domainsPerBm: 3,
        adSpendFee: 1.0,
        spendFeeCap: 449,
        monthlyTopupLimit: 60000,
        unlimitedReplacements: true,
      },
      scale: {
        price: 799,
        businessManagers: 10,
        adAccounts: 50,
        pixels: 10,
        domainsPerBm: 5,
        adSpendFee: 0.5,
        spendFeeCap: 1499,
        monthlyTopupLimit: 300000,
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
export const getPixelLimit = (planId: 'free' | 'starter' | 'growth' | 'scale') => {
  if (planId === 'free') {
    return 0;
  }
  if (shouldEnablePixelLimits() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].pixels;
  }
  return null;
};

// Get active BM limit for a plan
export const getActiveBmLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].businessManagers;
  }
  return null;
};

// Get active ad account limit for a plan
export const getActiveAdAccountLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].adAccounts;
  }
  return null;
};

// Get domain limit per BM for a plan
export const getDomainLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnableDomainLimits() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].domainsPerBm;
  }
  return null;
};

// Get monthly top-up limit for a plan
export const getMonthlyTopupLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnableTopupLimits() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].monthlyTopupLimit;
  }
  return null;
};

// Get spend fee cap for a plan
export const getSpendFeeCap = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnableAdSpendFees() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].spendFeeCap;
  }
  return null;
};

// Calculate maximum possible ad accounts based on BM limit
// Each BM can host max 7 ad accounts from provider
export const getMaxPossibleAdAccounts = (planId: 'starter' | 'growth' | 'scale') => {
  const bmLimit = getActiveBmLimit(planId);
  if (!bmLimit) return null;
  
  // Each BM can host 7 ad accounts max from provider
  return bmLimit * 7;
};

// Check if ad account limit exceeds BM capacity
export const validateAdAccountLimits = (planId: 'starter' | 'growth' | 'scale') => {
  const adAccountLimit = getActiveAdAccountLimit(planId);
  const maxPossible = getMaxPossibleAdAccounts(planId);
  
  if (!adAccountLimit || !maxPossible) return true;
  
  return adAccountLimit <= maxPossible;
}; 