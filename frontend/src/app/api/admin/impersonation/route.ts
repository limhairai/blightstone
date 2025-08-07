import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

/**
 * 🔒 SECURITY: Admin Impersonation API
 * 
 * Provides secure, audited impersonation for admin support cases
 * - Time-limited sessions (default 30 minutes)
 * - Full audit trail
 * - Required justification
 */

// POST /api/admin/impersonation - Start impersonation session
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { organizationId, reason, durationMinutes = 30 } = await request.json()

    if (!organizationId || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: organizationId, reason' 
      }, { status: 400 })
    }

    if (reason.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Reason must be at least 10 characters long' 
      }, { status: 400 })
    }

    // Set auth context for the function call
    await supabase.auth.setSession({ access_token: token, refresh_token: '' })

    // Start impersonation session
    const { data: sessionId, error: impersonationError } = await supabase
      .rpc('start_admin_impersonation', {
        p_target_organization_id: organizationId,
        p_reason: reason,
        p_duration_minutes: durationMinutes
      })

    if (impersonationError) {
      console.error('Impersonation start error:', impersonationError)
      return NextResponse.json({ 
        error: 'Failed to start impersonation session',
        details: impersonationError.message 
      }, { status: 500 })
    }

    // Log additional metadata
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await supabase
      .from('admin_impersonation_log')
      .insert({
        admin_user_id: user.id,
        target_organization_id: organizationId,
        action: 'session_created',
        reason: `Session created via API: ${reason}`,
        session_id: sessionId,
        ip_address: clientIP,
        user_agent: userAgent,
        metadata: {
          duration_minutes: durationMinutes,
          api_endpoint: '/api/admin/impersonation',
          timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      sessionId,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
      message: 'Impersonation session started successfully'
    })

  } catch (error) {
    console.error('Admin impersonation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE /api/admin/impersonation - End impersonation session
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'Missing sessionId parameter' 
      }, { status: 400 })
    }

    // Set auth context for the function call
    await supabase.auth.setSession({ access_token: token, refresh_token: '' })

    // End impersonation session
    const { data: success, error: endError } = await supabase
      .rpc('end_admin_impersonation', {
        p_session_id: sessionId
      })

    if (endError) {
      console.error('Impersonation end error:', endError)
      return NextResponse.json({ 
        error: 'Failed to end impersonation session',
        details: endError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended successfully'
    })

  } catch (error) {
    console.error('Admin impersonation end error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET /api/admin/impersonation - Get active impersonation sessions
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verify admin status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get active sessions for this admin
    const { data: sessions, error: sessionsError } = await supabase
      .from('admin_impersonation_sessions')
      .select(`
        session_id,
        target_organization_id,
        reason,
        status,
        created_at,
        expires_at,
        organizations!target_organization_id(name)
      `)
      .eq('admin_user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Sessions fetch error:', sessionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch sessions' 
      }, { status: 500 })
    }

    return NextResponse.json({
      sessions: sessions || [],
      count: sessions?.length || 0
    })

  } catch (error) {
    console.error('Admin impersonation sessions error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}