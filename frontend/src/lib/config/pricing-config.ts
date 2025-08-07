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
        pagesPerBm: number;
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
        pagesPerBm: number;
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
        pagesPerBm: number;
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
  
  // New pricing model - updated to final pricing structure
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 79, // Platform fee $79/month
        businessManagers: 1,
        adAccounts: 3,
        pixels: 0, // No pixel limits
        domainsPerBm: 2, // 2 promotion URLs (domains) per BM
        pagesPerBm: 3, // 3 Facebook pages per BM
        adSpendFee: 1.25, // 1.25% of top-ups
        spendFeeCap: 149, // Fee line caps at $149
        monthlyTopupLimit: 15000, // Monthly spend allowance $15,000
        unlimitedReplacements: true,
        bmApplicationFee: 0, // No BM application fees in new model
      },
      growth: {
        price: 299, // Platform fee $299/month
        businessManagers: 3,
        adAccounts: 10,
        pixels: 0, // No pixel limits
        domainsPerBm: 3, // 3 domains per BM
        pagesPerBm: 5, // 5 Facebook pages per BM
        adSpendFee: 1.0, // 1.00% spend fee
        spendFeeCap: 449, // Caps at $449
        monthlyTopupLimit: 60000, // Monthly spend allowance $60,000
        unlimitedReplacements: true,
        bmApplicationFee: 0, // No BM application fees in new model
      },
      scale: {
        price: 699, // Platform fee $699/month
        businessManagers: 5,
        adAccounts: 20,
        pixels: 0, // No pixel limits
        domainsPerBm: 5, // 5 domains per BM
        pagesPerBm: 10, // 10 Facebook pages per BM
        adSpendFee: 0.5, // 0.50% spend fee
        spendFeeCap: 1499, // Caps at $1,499
        monthlyTopupLimit: 300000, // Monthly spend allowance $300,000
        unlimitedReplacements: true,
        bmApplicationFee: 0, // No BM application fees in new model
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

// Get page limit per BM for a plan
export const getPageLimit = (planId: 'starter' | 'growth' | 'scale' | undefined | null) => {
  if (isNewPricingEnabled() && planId && planId in PRICING_CONFIG.newPricingModel.plans) {
    return PRICING_CONFIG.newPricingModel.plans[planId].pagesPerBm;
  }
  return 3; // Default to 3 pages if plan is undefined or not found
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