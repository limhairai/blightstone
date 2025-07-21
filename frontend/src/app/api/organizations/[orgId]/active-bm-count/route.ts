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

    // Count active business managers (real-time)
    const { count: activeBMCount } = await supabase
      .from('asset_binding')
      .select('*, asset!inner(type)', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('asset.type', 'business_manager')
      .eq('status', 'active')
      .eq('is_active', true)

    // Count pending business manager applications
    const { count: pendingBMCount } = await supabase
      .from('application')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('request_type', 'new_business_manager')
      .in('status', ['pending', 'processing'])

    const totalBMCount = (activeBMCount || 0) + (pendingBMCount || 0)

    return NextResponse.json({
      activeBMs: activeBMCount || 0,
      pendingBMs: pendingBMCount || 0,
      totalBMs: totalBMCount
    })

  } catch (error) {
    console.error('Active BM count fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch BM count' 
    }, { status: 500 })
  }
} 