// Pricing Configuration with Feature Flags
export interface PricingConfig {
  // Feature flags
  enableTopupLimits: boolean;
  enableAdSpendFees: boolean;
  enableDomainLimits: boolean;
  enableTeamLimits: boolean;
  enablePixelLimits: boolean;
  enableBmApplicationFees: boolean;
  enableAdAccountStatusDisplay: boolean;
  
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
        bmApplicationFee: number;
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
        bmApplicationFee: number;
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
        bmApplicationFee: number;
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
  enablePixelLimits: false, // Disabled - no pixel limits now
  enableBmApplicationFees: true, // Enabled - BM application fees now active
  enableAdAccountStatusDisplay: false, // Disabled - Dolphin status detection is unreliable
  
  // New pricing model - updated to match actual pricing structure
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 29,
        businessManagers: 1,
        adAccounts: 1,
        pixels: 0, // No pixel limits
        domainsPerBm: 1,
        adSpendFee: 5.0,
        spendFeeCap: 0, // No cap - topup limit naturally caps this
        monthlyTopupLimit: 2000,
        unlimitedReplacements: true,
        bmApplicationFee: 50, // $50 per BM application
      },
      growth: {
        price: 299,
        businessManagers: 2,
        adAccounts: 3,
        pixels: 0, // No pixel limits
        domainsPerBm: 3,
        adSpendFee: 0, // No ad spend fee
        spendFeeCap: 0,
        monthlyTopupLimit: 6000,
        unlimitedReplacements: true,
        bmApplicationFee: 30, // $30 per BM application
      },
      scale: {
        price: 699,
        businessManagers: 3,
        adAccounts: 5,
        pixels: 0, // No pixel limits
        domainsPerBm: 5,
        adSpendFee: 0, // No ad spend fee
        spendFeeCap: 0,
        monthlyTopupLimit: -1, // No spend limit
        unlimitedReplacements: true,
        bmApplicationFee: 0, // No BM application fee
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
export const shouldEnableAdAccountStatusDisplay = () => PRICING_CONFIG.enableAdAccountStatusDisplay;
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

// Get BM application fee for a plan
export const getBmApplicationFee = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnableBmApplicationFees() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].bmApplicationFee;
  }
  return 0;
}; 