/**
 * Subscription plan configurations
 */
const SUBSCRIPTION_PLANS = {
  starter: {
    monthlyFee: 29,
    adSpendFeePercent: 6,
    businessManagers: 3,
    adAccounts: 10,
    teamMembers: 2,
    monthlyTopupLimit: 6000
  },
  growth: {
    monthlyFee: 149,
    adSpendFeePercent: 3,
    businessManagers: 5,
    adAccounts: 25,
    teamMembers: 5,
    monthlyTopupLimit: 25000
  },
  scale: {
    monthlyFee: 499,
    adSpendFeePercent: 1.5,
    businessManagers: 15,
    adAccounts: 75,
    teamMembers: 15,
    monthlyTopupLimit: 100000
  },
  enterprise: {
    monthlyFee: 1499,
    adSpendFeePercent: 1,
    businessManagers: -1, // unlimited
    adAccounts: -1, // unlimited
    teamMembers: -1, // unlimited
    monthlyTopupLimit: -1 // unlimited
  }
} as const;

type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Calculate monthly subscription fee
 */
export function calculateSubscriptionFee(
  plan: string,
  daysInMonth: number = 30
): number {
  const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];
  
  if (!planConfig) {
    return 0;
  }

  const dailyRate = planConfig.monthlyFee / 30;
  return Math.round((dailyRate * daysInMonth) * 100) / 100;
}

/**
 * Calculate ad spend fee based on subscription plan
 */
export function calculateAdSpendFee(
  adSpendAmount: number,
  plan: string
): number {
  const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];
  
  if (!planConfig || adSpendAmount <= 0) {
    return 0;
  }

  const feeAmount = (adSpendAmount * planConfig.adSpendFeePercent) / 100;
  
  // Round to 4 decimal places to handle very small amounts
  return Math.round(feeAmount * 10000) / 10000;
}

/**
 * Calculate total fees for a billing period
 */
export function calculateTotalFees(params: {
  plan: string;
  adSpend: number;
  daysInMonth: number;
}): {
  subscriptionFee: number;
  adSpendFee: number;
  totalFee: number;
} {
  const subscriptionFee = calculateSubscriptionFee(params.plan, params.daysInMonth);
  const adSpendFee = calculateAdSpendFee(params.adSpend, params.plan);
  const totalFee = subscriptionFee + adSpendFee;

  return {
    subscriptionFee,
    adSpendFee,
    totalFee
  };
}

/**
 * Get subscription plan limits
 */
export function getSubscriptionLimits(plan: string): {
  businessManagers: number;
  adAccounts: number;
  teamMembers: number;
  monthlyTopupLimit: number;
} {
  const planConfig = SUBSCRIPTION_PLANS[plan as SubscriptionPlan];
  
  if (!planConfig) {
    return {
      businessManagers: 0,
      adAccounts: 0,
      teamMembers: 0,
      monthlyTopupLimit: 0
    };
  }

  return {
    businessManagers: planConfig.businessManagers,
    adAccounts: planConfig.adAccounts,
    teamMembers: planConfig.teamMembers,
    monthlyTopupLimit: planConfig.monthlyTopupLimit
  };
}

/**
 * Calculate upgrade cost difference
 */
export function calculateUpgradeCost(
  currentPlan: string,
  targetPlan: string,
  remainingDays: number = 30
): number {
  const currentFee = calculateSubscriptionFee(currentPlan, remainingDays);
  const targetFee = calculateSubscriptionFee(targetPlan, remainingDays);
  
  return Math.max(0, targetFee - currentFee);
}

/**
 * Calculate potential savings from plan change
 */
export function calculatePotentialSavings(
  currentPlan: string,
  targetPlan: string,
  monthlyAdSpend: number
): {
  subscriptionDifference: number;
  adSpendFeeDifference: number;
  totalMonthlySavings: number;
} {
  const currentSubscriptionFee = calculateSubscriptionFee(currentPlan);
  const targetSubscriptionFee = calculateSubscriptionFee(targetPlan);
  
  const currentAdSpendFee = calculateAdSpendFee(monthlyAdSpend, currentPlan);
  const targetAdSpendFee = calculateAdSpendFee(monthlyAdSpend, targetPlan);
  
  const subscriptionDifference = targetSubscriptionFee - currentSubscriptionFee;
  const adSpendFeeDifference = targetAdSpendFee - currentAdSpendFee;
  const totalMonthlySavings = -(subscriptionDifference + adSpendFeeDifference);

  return {
    subscriptionDifference,
    adSpendFeeDifference,
    totalMonthlySavings
  };
}

/**
 * Get recommended plan based on usage
 */
export function getRecommendedPlan(params: {
  businessManagers: number;
  adAccounts: number;
  teamMembers: number;
  monthlyAdSpend: number;
  monthlyTopupAmount: number;
}): {
  recommendedPlan: string;
  reason: string;
  estimatedMonthlyCost: number;
} {
  const plans = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[];
  
  // Find the minimum plan that meets all requirements
  for (const plan of plans) {
    const limits = getSubscriptionLimits(plan);
    
    // Check if plan meets all limits (-1 means unlimited)
    const meetsLimits = (
      (limits.businessManagers === -1 || params.businessManagers <= limits.businessManagers) &&
      (limits.adAccounts === -1 || params.adAccounts <= limits.adAccounts) &&
      (limits.teamMembers === -1 || params.teamMembers <= limits.teamMembers) &&
      (limits.monthlyTopupLimit === -1 || params.monthlyTopupAmount <= limits.monthlyTopupLimit)
    );
    
    if (meetsLimits) {
      const estimatedCost = calculateTotalFees({
        plan,
        adSpend: params.monthlyAdSpend,
        daysInMonth: 30
      });
      
      return {
        recommendedPlan: plan,
        reason: `Meets all your requirements with ${limits.businessManagers === -1 ? 'unlimited' : limits.businessManagers} business managers, ${limits.adAccounts === -1 ? 'unlimited' : limits.adAccounts} ad accounts, and ${limits.teamMembers === -1 ? 'unlimited' : limits.teamMembers} team members.`,
        estimatedMonthlyCost: estimatedCost.totalFee
      };
    }
  }
  
  // Fallback to enterprise if no plan meets requirements
  const enterpriseCost = calculateTotalFees({
    plan: 'enterprise',
    adSpend: params.monthlyAdSpend,
    daysInMonth: 30
  });
  
  return {
    recommendedPlan: 'enterprise',
    reason: 'Your usage exceeds the limits of other plans. Enterprise offers unlimited resources.',
    estimatedMonthlyCost: enterpriseCost.totalFee
  };
}

/**
 * Calculate cost comparison across all plans
 */
export function calculateCostComparison(
  monthlyAdSpend: number
): Array<{
  plan: string;
  subscriptionFee: number;
  adSpendFee: number;
  totalFee: number;
  limits: ReturnType<typeof getSubscriptionLimits>;
}> {
  const plans = Object.keys(SUBSCRIPTION_PLANS) as SubscriptionPlan[];
  
  return plans.map(plan => {
    const fees = calculateTotalFees({
      plan,
      adSpend: monthlyAdSpend,
      daysInMonth: 30
    });
    
    return {
      plan,
      subscriptionFee: fees.subscriptionFee,
      adSpendFee: fees.adSpendFee,
      totalFee: fees.totalFee,
      limits: getSubscriptionLimits(plan)
    };
  });
} 