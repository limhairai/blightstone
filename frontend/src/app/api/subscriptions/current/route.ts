import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

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

    // Handle no subscription scenario - assign free plan
    if (!orgData.plan_id) {
      // Update organization with free plan
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          plan_id: 'free'
        })
        .eq('organization_id', organizationId)
        
      if (updateError) {
        console.error('Error assigning free plan:', updateError)
      } else {
        // Update local data
        orgData.plan_id = 'free'
      }
    }

    // Get plan data for existing subscription
    let currentPlan = null
    
    // Handle free plan specially (not in database)
    if (orgData.plan_id === 'free') {
      currentPlan = {
        id: 'free',
        name: 'Free',
        description: 'Basic access to dashboard',
        monthlyPrice: 0,
        adSpendFee: 0,
        maxTeamMembers: 1,
        maxBusinesses: 0,
        maxAdAccounts: 0,
        features: ['Dashboard Access', 'Feature Preview']
      }
    } else {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('plan_id', orgData.plan_id)
        .single()

      if (!planError && planData) {
        currentPlan = {
          id: planData.plan_id,
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
    }

    // Check if on free plan
    const isOnFreePlan = orgData.plan_id === 'free'

    // Get actual usage data
    // Count team members
    const { count: teamMembersCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    // Count active business managers
    const { count: activeBMCount } = await supabase
      .from('asset_binding')
      .select('*, asset!inner(type)', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('asset.type', 'business_manager')
      .eq('status', 'active')

    // Count pending business manager applications
    const { count: pendingBMCount } = await supabase
      .from('application')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('request_type', 'new_business_manager')
      .in('status', ['pending', 'processing'])

    // Count active ad accounts
    const { count: activeAdAccountsCount } = await supabase
      .from('asset_binding')
      .select('*, asset!inner(type)', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('asset.type', 'ad_account')
      .eq('status', 'active')

    // Count pending ad account applications
    const { count: pendingAdAccountsCount } = await supabase
      .from('application')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('request_type', 'additional_accounts')
      .in('status', ['pending', 'processing'])

    const usage = {
      teamMembers: teamMembersCount || 1, // At least 1 (the owner)
      businessManagers: (activeBMCount || 0) + (pendingBMCount || 0), // Include pending applications
      adAccounts: (activeAdAccountsCount || 0) + (pendingAdAccountsCount || 0) // Include pending applications
    }

    // Determine capabilities based on plan
    let canTopup = true
    let canRequestAssets = true
    let message = null

    if (isOnFreePlan) {
      canTopup = false // No topups on free plan
      canRequestAssets = false // No asset requests on free plan
      message = 'You\'re on the free plan. Upgrade to access topups and request business managers & ad accounts.'
    }

    const response = NextResponse.json({
      currentPlan,
      usage,
      subscriptionStatus: isOnFreePlan ? 'free' : orgData.subscription_status,
      frozen: false, // Free plan users aren't frozen, just limited
      free: isOnFreePlan,
      message,
      canTopup,
      canRequestAssets
    })

    // Add caching headers - much shorter cache for subscription data
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30') // 30 seconds for subscription data
    response.headers.set('Vary', 'Authorization')
    
    // Add cache tags for revalidation
    response.headers.set('Cache-Tag', `subscription-${organizationId},organization-${organizationId},subscriptions`)

    return response

  } catch (error) {
    console.error('Error in /api/subscriptions/current:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 