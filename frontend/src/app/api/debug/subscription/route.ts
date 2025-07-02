import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('org')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (orgError) {
      return NextResponse.json({ error: 'Organization not found', details: orgError }, { status: 404 })
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    return NextResponse.json({
      organization: org,
      subscription: subscription || null,
      subscriptionError: subError || null
    })
  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 