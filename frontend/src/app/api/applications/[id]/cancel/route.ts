import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const applicationId = params.id

    // Check if application exists and belongs to user's organization
    const { data: application, error: fetchError } = await supabase
      .from('application')
      .select('*')
      .eq('application_id', applicationId)
      .eq('organization_id', profile.organization_id)
      .in('status', ['pending', 'processing'])
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ 
        error: 'Application not found or cannot be cancelled' 
      }, { status: 404 })
    }

    // Update application status to cancelled
    const { error: updateError } = await supabase
      .from('application')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)

    if (updateError) {
      console.error('Error cancelling application:', updateError)
      return NextResponse.json({ 
        error: 'Failed to cancel application' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Application cancelled successfully' 
    })

  } catch (error) {
    console.error('Error in cancel application API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 