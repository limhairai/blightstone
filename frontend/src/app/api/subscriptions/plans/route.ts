import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Fetch plans from database (exclude free plan for upgrade dialog)
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