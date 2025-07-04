import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('monthly_subscription_fee_cents', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedPlans = plans.map(plan => ({
      id: plan.plan_id, // Use semantic ID
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthly_subscription_fee_cents / 100,
      adSpendFee: plan.ad_spend_fee_percentage,
      maxTeamMembers: plan.max_team_members,
      maxBusinesses: plan.max_businesses,
      maxAdAccounts: plan.max_ad_accounts,
      features: plan.features || [],
      stripe_price_id: plan.stripe_price_id
    }))

    return NextResponse.json({ plans: transformedPlans })
  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 