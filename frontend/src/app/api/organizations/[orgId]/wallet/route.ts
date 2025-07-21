import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    // Get authenticated user
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const orgId = params.orgId

    // Verify user is member of this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get organization wallet balance
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('wallet_balance')
      .eq('organization_id', orgId)
      .single()

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      balance: orgData.wallet_balance || 0
    })

  } catch (error) {
    console.error('Wallet balance fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch wallet balance' 
    }, { status: 500 })
  }
} 