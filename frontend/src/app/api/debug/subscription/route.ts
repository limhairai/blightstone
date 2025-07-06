import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get organization data directly from database
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found', details: orgError }, { status: 404 })
    }

    // Get subscription data directly from database
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    // Get plan data
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('plan_id', orgData.plan_id)
      .single()

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      organization: orgData,
      subscription: subData,
      subscriptionError: subError,
      plan: planData,
      planError: planError,
      debug: {
        organizationPlanId: orgData.plan_id,
        subscriptionStatus: orgData.subscription_status,
        stripeSubscriptionId: subData?.stripe_subscription_id,
        currentPeriodStart: orgData.current_period_start,
        currentPeriodEnd: orgData.current_period_end,
      }
    })

  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch debug data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 