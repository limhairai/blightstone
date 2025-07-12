// Pricing Configuration with Feature Flags
export interface PricingConfig {
  // Feature flags
  enableTopupLimits: boolean;
  enableAdSpendFees: boolean;
  enableDomainLimits: boolean;
  enableTeamLimits: boolean;
  enablePromotionUrlLimits: boolean;
  
  // New pricing model
  newPricingModel: {
    enabled: boolean;
    plans: {
      starter: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        promotionUrls: number;
        adSpendFee: number;
        unlimitedReplacements: boolean;
      };
      growth: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        promotionUrls: number;
        adSpendFee: number;
        unlimitedReplacements: boolean;
      };
      scale: {
        price: number;
        businessManagers: number;
        adAccounts: number;
        promotionUrls: number;
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
  enablePromotionUrlLimits: true, // Enable promotion URL limits
  
  // New pricing model
  newPricingModel: {
    enabled: true,
    plans: {
      starter: {
        price: 79,
        businessManagers: 3,
        adAccounts: 15,
        promotionUrls: 1,
        adSpendFee: 1, // 1% ad spend fee
        unlimitedReplacements: true,
      },
      growth: {
        price: 299,
        businessManagers: 5,
        adAccounts: 25,
        promotionUrls: 3,
        adSpendFee: 1, // 1% ad spend fee
        unlimitedReplacements: true,
      },
      scale: {
        price: 699,
        businessManagers: 15,
        adAccounts: 75,
        promotionUrls: 10,
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
export const shouldEnablePromotionUrlLimits = () => PRICING_CONFIG.enablePromotionUrlLimits;
export const isNewPricingEnabled = () => PRICING_CONFIG.newPricingModel.enabled;

// Get pricing for a specific plan
export const getPlanPricing = (planId: 'starter' | 'growth' | 'scale') => {
  if (isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId];
  }
  // Return old pricing logic here if needed
  return null;
};

// Get promotion URL limit for a plan
export const getPromotionUrlLimit = (planId: 'starter' | 'growth' | 'scale') => {
  if (shouldEnablePromotionUrlLimits() && isNewPricingEnabled()) {
    return PRICING_CONFIG.newPricingModel.plans[planId].promotionUrls;
  }
  return null; // No limit if feature disabled
}; 