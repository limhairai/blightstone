import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { action, newPlanId } = await request.json()
    const organizationId = params.orgId

    if (action === 'cancel') {
      // Handle subscription cancellation
      const { data, error } = await supabase
        .rpc('handle_subscription_cancellation', {
          p_organization_id: organizationId
        })

      if (error) {
        console.error('Error cancelling subscription:', error)
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Subscription cancelled successfully' 
      })
    }

    if (action === 'downgrade') {
      if (!newPlanId) {
        return NextResponse.json({ error: 'New plan ID required for downgrade' }, { status: 400 })
      }

      // Handle plan downgrade
      const { data, error } = await supabase
        .rpc('handle_plan_downgrade', {
          p_organization_id: organizationId,
          p_new_plan_id: newPlanId
        })

      if (error) {
        console.error('Error downgrading plan:', error)
        return NextResponse.json({ error: 'Failed to downgrade plan' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Plan downgraded successfully' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Subscription management error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const organizationId = params.orgId

    // Get organization subscription details
    const { data: org, error } = await supabase
      .from('organizations')
      .select(`
        organization_id,
        name,
        plan_id,
        subscription_status,
        subscription_cancelled_at,
        data_retention_until,
        previous_plan_id,
        downgrade_scheduled_at,
        plans (
          plan_id,
          name,
          max_businesses,
          max_ad_accounts,
          monthly_topup_limit_cents
        )
      `)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get asset counts
    const { data: assetCounts, error: countsError } = await supabase
      .from('asset_binding')
      .select(`
        asset_id,
        is_active,
        asset (
          type
        )
      `)
      .eq('organization_id', organizationId)

    if (countsError) {
      console.error('Error fetching asset counts:', error)
      return NextResponse.json({ error: 'Failed to fetch asset counts' }, { status: 500 })
    }

    const activeCounts = assetCounts?.reduce((acc, binding: any) => {
      if (binding.is_active && binding.asset?.type) {
        const type = binding.asset.type
        if (type === 'business_manager') acc.businessManagers++
        if (type === 'ad_account') acc.adAccounts++
      }
      return acc
    }, { businessManagers: 0, adAccounts: 0 }) || { businessManagers: 0, adAccounts: 0 }

    return NextResponse.json({
      organization: {
        ...org,
        activeCounts
      }
    })

  } catch (error) {
    console.error('Error fetching subscription details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 