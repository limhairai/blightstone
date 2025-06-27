import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Promote user to admin (bootstrap first admin or promote existing user)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if any superusers exist
    const { data: existingSuperusers, error: countError } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_superuser', true)
      .limit(1)

    if (countError) {
      console.error('Error checking existing superusers:', countError)
      return NextResponse.json(
        { error: 'Failed to check existing admins' },
        { status: 500 }
      )
    }

    const isFirstAdmin = !existingSuperusers || existingSuperusers.length === 0

    // If this is the first admin, allow bootstrap without authentication
    if (isFirstAdmin) {
      // Find user by email in auth.users
      const { data: users, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError) {
        console.error('Error listing users:', userError)
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        )
      }

      const user = users.users.find(u => u.email === email)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found. Please register first.' },
          { status: 404 }
        )
      }

      // Create or update profile to make them admin
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          is_superuser: true
        })

      if (upsertError) {
        console.error('Error creating admin profile:', upsertError)
        return NextResponse.json(
          { error: 'Failed to create admin profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Successfully promoted ${email} to admin (first admin bootstrap)`,
        is_first_admin: true
      })
    } else {
      // For subsequent admins, require authentication from existing admin
      const authHeader = request.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Authentication required to promote users' },
          { status: 401 }
        )
      }

      const token = authHeader.replace('Bearer ', '')
      
      // Verify the requester is an admin
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token)
      
      if (authError || !currentUser) {
        return NextResponse.json(
          { error: 'Invalid authentication token' },
          { status: 401 }
        )
      }

      // Check if current user is admin
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_superuser')
        .eq('id', currentUser.id)
        .single()

      if (profileError || !currentProfile?.is_superuser) {
        return NextResponse.json(
          { error: 'Only admins can promote other users' },
          { status: 403 }
        )
      }

      // Find target user and promote them
      const { data: users, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError) {
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: 500 }
        )
      }

      const targetUser = users.users.find(u => u.email === email)
      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found. Please ensure they have registered.' },
          { status: 404 }
        )
      }

      // Promote user to admin
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.user_metadata?.full_name || targetUser.email?.split('@')[0] || '',
          is_superuser: true
        })

      if (updateError) {
        console.error('Error promoting user:', updateError)
        return NextResponse.json(
          { error: 'Failed to promote user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Successfully promoted ${email} to admin`,
        is_first_admin: false
      })
    }
  } catch (error) {
    console.error('Promotion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 