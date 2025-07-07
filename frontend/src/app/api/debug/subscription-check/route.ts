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

    console.log('🔍 Debug: Checking subscription for organization:', organizationId)

    // Check organization data
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('organization_id, name, plan_id, subscription_status, stripe_customer_id, stripe_subscription_id, updated_at')
      .eq('organization_id', organizationId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({ error: 'Organization not found', details: orgError }, { status: 404 })
    }

    // Check subscription data
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)

    // Check plan data
    let planData = null
    if (orgData.plan_id && orgData.plan_id !== 'free') {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('plan_id', orgData.plan_id)
        .single()
      
      if (!planError) {
        planData = plan
      }
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      organization: orgData,
      subscription: subscriptionData?.[0] || null,
      plan: planData,
      hasActiveSubscription: !!subscriptionData?.[0],
      isOnFreePlan: orgData.plan_id === 'free',
      hasStripeCustomer: !!orgData.stripe_customer_id,
      hasStripeSubscription: !!orgData.stripe_subscription_id,
    }

    console.log('🔍 Debug info:', debugInfo)

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Error in subscription debug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 