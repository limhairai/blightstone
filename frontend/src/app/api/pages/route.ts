import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/pages - Fetch organization's pages
export async function GET(request: NextRequest) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const requestedOrgId = searchParams.get('organization_id')

    // Get user's profile and determine organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id, is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let organizationId: string

    if (requestedOrgId) {
      // Verify user has access to requested organization
      const { data: orgAccess, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select('owner_id')
        .eq('organization_id', requestedOrgId)
        .single()
      
      if (orgError || !orgAccess) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      
      // Check if user is owner
      if (orgAccess.owner_id === user.id) {
        organizationId = requestedOrgId
      } else {
        // Check if user is a member
        const { data: membership, error: membershipError } = await supabaseAdmin
          .from('organization_members')
          .select('role')
          .eq('organization_id', requestedOrgId)
          .eq('user_id', user.id)
          .single()
        
        if (membershipError || !membership) {
          return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
        }
        
        organizationId = requestedOrgId
      }
    } else {
      // Fallback to user's profile organization
      organizationId = profile.organization_id
    }

    // First, fetch pages for the organization
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('pages')
      .select(`
        page_id,
        facebook_page_id,
        page_name,
        page_url,
        category,
        verification_status,
        status,
        followers_count,
        likes_count,
        created_at,
        updated_at
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    // Then fetch BM information for each page separately
    const pagesWithBMInfo = await Promise.all(
      (pages || []).map(async (page: any) => {
        // Get BM info from bm_pages and asset tables
        const { data: bmData } = await supabaseAdmin
          .from('bm_pages')
          .select(`
            business_manager_id,
            asset!inner (
              name,
              dolphin_business_manager_id
            )
          `)
          .eq('page_id', page.page_id)
          .eq('asset.organization_id', organizationId)
          .eq('asset.type', 'business_manager')
          .single()

        return {
          ...page,
          bm_name: (bmData?.asset as any)?.name || null,
          bm_id: (bmData?.asset as any)?.dolphin_business_manager_id || null,
          business_manager_id: bmData?.business_manager_id || null
        }
      })
    )

    // Get plan limits for the organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('plan_id')
      .eq('organization_id', organizationId)
      .single()

    const planId = orgData?.plan_id || 'free'
    const planLimits = {
      free: 1,
      starter: 3,
      growth: 5,
      scale: 10
    }

    const pageLimit = planLimits[planId as keyof typeof planLimits] || 1
    const currentCount = pagesWithBMInfo?.length || 0

    return NextResponse.json({
      pages: pagesWithBMInfo || [],
      pagination: {
        total: currentCount,
        limit: pageLimit,
        canAddMore: currentCount < pageLimit
      }
    })

  } catch (error) {
    console.error('Error in pages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/pages - Add a new page
export async function POST(request: NextRequest) {
  try {
    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { facebook_page_id, page_name, page_url, category, organization_id } = body

    if (!facebook_page_id || !page_name) {
      return NextResponse.json({ error: 'Facebook Page ID and name are required' }, { status: 400 })
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const targetOrgId = organization_id || profile.organization_id

    // Verify user has access to the organization
    if (targetOrgId !== profile.organization_id) {
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('organization_id', targetOrgId)
        .eq('user_id', user.id)
        .single()
      
      if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Access denied to this organization' }, { status: 403 })
      }
    }

    // Check plan limits
    const { data: canAdd, error: limitError } = await supabaseAdmin
      .rpc('can_add_pages', { org_id: targetOrgId, requested_count: 1 })

    if (limitError || !canAdd) {
      return NextResponse.json({ 
        error: 'Page limit reached for your plan. Upgrade to add more pages.' 
      }, { status: 403 })
    }

    // Check if page already exists
    const { data: existingPage, error: checkError } = await supabaseAdmin
      .from('pages')
      .select('page_id')
      .eq('organization_id', targetOrgId)
      .eq('facebook_page_id', facebook_page_id)
      .single()

    if (existingPage) {
      return NextResponse.json({ error: 'This Facebook page is already added' }, { status: 409 })
    }

    // Create the page
    const { data: newPage, error: createError } = await supabaseAdmin
      .from('pages')
      .insert({
        organization_id: targetOrgId,
        facebook_page_id,
        page_name,
        page_url,
        category,
        added_by: user.id,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating page:', createError)
      return NextResponse.json({ error: 'Failed to add page' }, { status: 500 })
    }

    return NextResponse.json({ page: newPage }, { status: 201 })

  } catch (error) {
    console.error('Error in pages POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}