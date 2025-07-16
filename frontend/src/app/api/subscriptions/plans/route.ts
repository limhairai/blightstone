import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRICING_CONFIG } from '@/lib/config/pricing-config'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Use new pricing config if enabled
    if (PRICING_CONFIG.newPricingModel.enabled) {
      // Get actual Stripe price IDs from database for the new pricing
      const { data: dbPlans, error: dbError } = await supabase
        .from('plans')
        .select('plan_id, stripe_price_id')
        .in('plan_id', ['starter', 'growth', 'scale'])
        .eq('is_active', true)

      const stripeIds: Record<string, string | null> = {}
      if (!dbError && dbPlans) {
        dbPlans.forEach(plan => {
          stripeIds[plan.plan_id] = plan.stripe_price_id
        })
      }

      const plans = [
        {
          id: 'starter',
          name: 'Starter',
          description: '',
          monthlyPrice: PRICING_CONFIG.newPricingModel.plans.starter.price,
          adSpendFee: PRICING_CONFIG.newPricingModel.plans.starter.adSpendFee,
          maxTeamMembers: -1, // Unlimited
          maxBusinesses: PRICING_CONFIG.newPricingModel.plans.starter.businessManagers,
          maxAdAccounts: PRICING_CONFIG.newPricingModel.plans.starter.adAccounts,
          features: [
            `${PRICING_CONFIG.newPricingModel.plans.starter.businessManagers} Active Business Managers`,
            `${PRICING_CONFIG.newPricingModel.plans.starter.adAccounts} Active Ad Accounts`,
            `${PRICING_CONFIG.newPricingModel.plans.starter.pixels} Facebook Pixels`,
            'No Spend Limit',
            'Unlimited Replacements',
            '1% Ad Spend Fee',
            '24/7 Support'
          ],
          stripe_price_id: stripeIds['starter'] || null, // Use actual Stripe price ID from database
          isCustom: false
        },
        {
          id: 'growth',
          name: 'Growth',
          description: '',
          monthlyPrice: PRICING_CONFIG.newPricingModel.plans.growth.price,
          adSpendFee: PRICING_CONFIG.newPricingModel.plans.growth.adSpendFee,
          maxTeamMembers: -1, // Unlimited
          maxBusinesses: PRICING_CONFIG.newPricingModel.plans.growth.businessManagers,
          maxAdAccounts: PRICING_CONFIG.newPricingModel.plans.growth.adAccounts,
          features: [
            `${PRICING_CONFIG.newPricingModel.plans.growth.businessManagers} Active Business Managers`,
            `${PRICING_CONFIG.newPricingModel.plans.growth.adAccounts} Active Ad Accounts`,
            `${PRICING_CONFIG.newPricingModel.plans.growth.pixels} Facebook Pixels`,
            'No Spend Limit',
            'Unlimited Replacements',
            '1% Ad Spend Fee',
            'Priority Support'
          ],
          stripe_price_id: stripeIds['growth'] || null, // Use actual Stripe price ID from database
          isCustom: false
        },
        {
          id: 'scale',
          name: 'Scale',
          description: '',
          monthlyPrice: PRICING_CONFIG.newPricingModel.plans.scale.price,
          adSpendFee: PRICING_CONFIG.newPricingModel.plans.scale.adSpendFee,
          maxTeamMembers: -1, // Unlimited
          maxBusinesses: PRICING_CONFIG.newPricingModel.plans.scale.businessManagers,
          maxAdAccounts: PRICING_CONFIG.newPricingModel.plans.scale.adAccounts,
          features: [
            `${PRICING_CONFIG.newPricingModel.plans.scale.businessManagers} Active Business Managers`,
            `${PRICING_CONFIG.newPricingModel.plans.scale.adAccounts} Active Ad Accounts`,
            `${PRICING_CONFIG.newPricingModel.plans.scale.pixels} Facebook Pixels`,
            'No Spend Limit',
            'Unlimited Replacements',
            '1% Ad Spend Fee',
            'Dedicated Support'
          ],
          stripe_price_id: stripeIds['scale'] || null, // Use actual Stripe price ID from database
          isCustom: false
        },
        {
          id: 'plus',
          name: 'Plus',
          description: 'For agencies and enterprises managing high-volume Facebook ad campaigns',
          monthlyPrice: 0, // Will show "Coming Soon"
          adSpendFee: 0,
          maxTeamMembers: -1,
          maxBusinesses: -1,
          maxAdAccounts: -1,
          features: [
            'Unlimited Active Business Managers',
            'Unlimited Active Ad Accounts',
            'Unlimited Facebook Pixels',
            'No Spend Limit',
            'White-label Solutions',
            'Dedicated Account Manager',
            'Priority Support',
            'Custom Integrations',
            'Advanced Analytics',
            'API Access'
          ],
          stripe_price_id: null,
          isCustom: true, // This makes it show "Coming Soon" instead of price
          isComingSoon: true
        }
      ]

      return NextResponse.json({ plans })
    }

    // Fallback to database plans (legacy pricing)
    const { data: dbPlans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .neq('plan_id', 'free')  // Exclude free plan from upgrade options
      .order('monthly_subscription_fee_cents', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Transform database plans to frontend format
    const plans = dbPlans.map(plan => ({
      id: plan.plan_id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthly_subscription_fee_cents / 100, // Convert cents to dollars
      adSpendFee: plan.ad_spend_fee_percentage,
      maxTeamMembers: plan.max_team_members,
      maxBusinesses: plan.max_businesses,
      maxAdAccounts: plan.max_ad_accounts,
      features: plan.features || [],
      stripe_price_id: plan.stripe_price_id,
      isCustom: plan.plan_id === 'custom' || plan.plan_id === 'enterprise'
    }))

    // Add the custom plan if it doesn't exist in database
    const hasCustom = plans.some(p => p.isCustom)
    if (!hasCustom) {
      plans.push({
        id: 'custom',
        name: 'Custom',
        description: 'For large organizations',
        monthlyPrice: 0,
        adSpendFee: 0,
        maxTeamMembers: -1,
        maxBusinesses: -1,
        maxAdAccounts: -1,
        features: ['24/7 Support', 'Custom Features', 'Unlimited Everything'],
        isCustom: true,
        stripe_price_id: null
      })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 