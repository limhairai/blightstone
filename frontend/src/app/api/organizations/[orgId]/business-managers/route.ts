import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    // Create anon client for user authentication
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's profile and verify organization access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user has access to this organization
    const isAdmin = profile.is_superuser === true
    if (!isAdmin && profile.organization_id !== params.orgId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get business managers for the organization
    const { data: businessManagers, error: bmError } = await supabase
      .from('asset_binding')
      .select(`
        asset_id,
        status,
        is_active,
        asset:asset!inner(
          asset_id,
          name,
          dolphin_id,
          type,
          status,
          metadata
        )
      `)
      .eq('organization_id', params.orgId)
      .eq('asset.type', 'business_manager')
      .eq('status', 'active')

    if (bmError) {
      console.error('Error fetching business managers:', bmError)
      return NextResponse.json({ error: 'Failed to fetch business managers' }, { status: 500 })
    }

    // Transform the data for frontend
    const transformedBusinessManagers = businessManagers.map((binding: any) => ({
      asset_id: binding.asset.asset_id,
      name: binding.asset.name,
      dolphin_id: binding.asset.dolphin_id,
      status: binding.asset.status,
      is_active: binding.is_active !== false, // Use the asset_binding.is_active field
      metadata: binding.asset.metadata || {}
    }))

    return NextResponse.json({
      business_managers: transformedBusinessManagers
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300', // Cache for 1 minute
      }
    })

  } catch (error) {
    console.error('Error fetching business managers:', error)
    return NextResponse.json({ error: 'Failed to fetch business managers' }, { status: 500 })
  }
} 