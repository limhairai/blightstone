import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const amount = searchParams.get('amount') // Optional, for checking specific amount

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if organization can make topup request
    const amountCents = amount ? Math.round(parseFloat(amount) * 100) : 0
    
    const { data: limitCheck, error } = await supabase
      .rpc('can_make_topup_request', {
        org_id: organizationId,
        request_amount_cents: amountCents
      })

    if (error) {
      console.error('Error checking topup limits:', error)
      return NextResponse.json({ error: 'Failed to check limits' }, { status: 500 })
    }

    // Get organization plan details for additional context
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('plan_id')
      .eq('organization_id', organizationId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('name, monthly_topup_limit_cents')
      .eq('plan_id', orgData.plan_id)
      .single()

    if (planError) {
      console.error('Error fetching plan:', planError)
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Format response
    const response = {
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      currentUsage: limitCheck.current_usage / 100, // Convert to dollars
      limit: limitCheck.limit ? limitCheck.limit / 100 : null, // Convert to dollars or null for unlimited
      available: limitCheck.available ? limitCheck.available / 100 : null, // Convert to dollars or null for unlimited
      planName: planData.name,
      hasLimit: planData.monthly_topup_limit_cents !== null,
      isUnlimited: planData.monthly_topup_limit_cents === null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in topup limits API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 