import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get organization ID from query params - handle both 'id' and 'organizationId'
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId') || searchParams.get('id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    console.log('Fetching subscription for organization ID:', organizationId)

    // Get organization data first
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('organization_id, name, plan_id, subscription_status')
      .eq('organization_id', organizationId)
      .single()

    if (orgError || !orgData) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Handle no subscription scenario
    if (!orgData.plan_id) {
      console.log('No plan_id found - organization has no subscription, treating as frozen')
      
      return NextResponse.json({
        currentPlan: null,
        usage: {
          teamMembers: 1,
          businessManagers: 0,
          adAccounts: 0
        },
        subscriptionStatus: 'no_subscription',
        frozen: true,
        message: 'No active subscription. Please subscribe to a plan to continue using the service.',
        canTopup: false,
        canRequestAssets: false
      })
    }

    // Get plan data for existing subscription
    let currentPlan = null
    console.log('Organization has plan_id:', orgData.plan_id)
    
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', orgData.plan_id)
      .single()

    if (!planError && planData) {
      currentPlan = {
        id: planData.id,
        name: planData.name,
        description: planData.description,
        monthlyPrice: planData.monthly_subscription_fee_cents / 100,
        adSpendFee: planData.ad_spend_fee_percentage,
        maxTeamMembers: planData.max_team_members,
        maxBusinesses: planData.max_businesses,
        maxAdAccounts: planData.max_ad_accounts,
        features: planData.features || []
      }
    } else {
      console.error('Error fetching plan data:', planError)
      // Plan exists in org but not in plans table - treat as frozen
      return NextResponse.json({
        currentPlan: null,
        usage: {
          teamMembers: 1,
          businessManagers: 0,
          adAccounts: 0
        },
        subscriptionStatus: 'frozen',
        frozen: true,
        message: 'Subscription plan not found. Please contact support.',
        canTopup: false,
        canRequestAssets: false
      })
    }

    // Get usage data - simplified for now
    const usage = {
      teamMembers: 1, // TODO: Count from organization_members
      businessManagers: 0, // TODO: Count from business_managers
      adAccounts: 0 // TODO: Count from ad_accounts
    }

    return NextResponse.json({
      currentPlan,
      usage,
      subscriptionStatus: orgData.subscription_status
    })

  } catch (error) {
    console.error('Error in /api/subscriptions/current:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 