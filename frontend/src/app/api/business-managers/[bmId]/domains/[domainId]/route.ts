import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Create service role client for admin operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create user client for authentication
function createUserClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// DELETE /api/business-managers/[bmId]/domains/[domainId]
// Remove a domain from a Business Manager
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bmId: string; domainId: string } }
) {
  try {
    const supabase = createUserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { bmId, domainId } = params

    // Get user's organization
    const { data: orgMembership, error: orgError } = await supabaseService
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMembership) {
      return NextResponse.json({ error: 'User is not a member of any organization' }, { status: 403 })
    }

    const organizationId = orgMembership.organization_id

    // Verify the domain exists and belongs to the user's organization and BM
    const { data: domain, error: domainError } = await supabaseService
      .from('bm_domains')
      .select('*')
      .eq('domain_id', domainId)
      .eq('bm_asset_id', bmId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single()

    if (domainError || !domain) {
      return NextResponse.json({ error: 'Domain not found or not accessible' }, { status: 404 })
    }

    // Soft delete the domain (set is_active to false)
    const { error: deleteError } = await supabaseService
      .from('bm_domains')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('domain_id', domainId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error deleting domain:', deleteError)
      return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully'
    })

  } catch (error) {
    console.error('Error in domain DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 