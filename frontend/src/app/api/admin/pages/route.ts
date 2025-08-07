import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/pages - Fetch all pages (admin only)
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

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    // Fetch all pages with organization info
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('pages')
      .select(`
        page_id,
        organization_id,
        facebook_page_id,
        page_name,
        page_url,
        category,
        verification_status,
        status,
        followers_count,
        likes_count,
        created_at,
        updated_at,
        organizations (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (pagesError) {
      console.error('Error fetching pages:', pagesError)
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('pages')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting pages:', countError)
    }

    // Transform data to include organization name
    const transformedPages = (pages || []).map(page => ({
      ...page,
      organization: {
        name: (page.organizations as any)?.name || 'Unknown Organization'
      }
    }))

    return NextResponse.json({
      pages: transformedPages,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin pages GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}