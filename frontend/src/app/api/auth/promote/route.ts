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
      .select('profile_id')
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

      // Check if profile already exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('profile_id, is_superuser')
        .eq('profile_id', user.id)
        .single()

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', profileCheckError)
        return NextResponse.json(
          { error: 'Failed to check existing profile' },
          { status: 500 }
        )
      }

      if (existingProfile) {
        // Update existing profile to make them superuser
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_superuser: true })
          .eq('profile_id', user.id)

        if (updateError) {
          console.error('Error updating profile to superuser:', updateError)
          return NextResponse.json(
            { error: 'Failed to update profile to superuser' },
            { status: 500 }
          )
        }
      } else {
        // Create new profile with superuser status
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            profile_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
            is_superuser: true,
            role: 'admin'
          })

        if (insertError) {
          console.error('Error creating superuser profile:', insertError)
          return NextResponse.json(
            { error: 'Failed to create superuser profile' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully promoted ${email} to superuser (first admin bootstrap)`,
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
        .eq('profile_id', currentUser.id)
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

      // Check if target profile exists
      const { data: targetProfile, error: targetProfileError } = await supabase
        .from('profiles')
        .select('profile_id, is_superuser')
        .eq('profile_id', targetUser.id)
        .single()

      if (targetProfileError && targetProfileError.code !== 'PGRST116') {
        console.error('Error checking target profile:', targetProfileError)
        return NextResponse.json(
          { error: 'Failed to check target user profile' },
          { status: 500 }
        )
      }

      if (targetProfile) {
        // Update existing profile to superuser
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_superuser: true, role: 'admin' })
          .eq('profile_id', targetUser.id)

        if (updateError) {
          console.error('Error promoting user:', updateError)
          return NextResponse.json(
            { error: 'Failed to promote user' },
            { status: 500 }
          )
        }
      } else {
        // Create new profile with superuser status
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            profile_id: targetUser.id,
            email: targetUser.email,
            name: targetUser.user_metadata?.full_name || targetUser.email?.split('@')[0] || 'User',
            is_superuser: true,
            role: 'admin'
          })

        if (insertError) {
          console.error('Error creating superuser profile:', insertError)
          return NextResponse.json(
            { error: 'Failed to create superuser profile' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully promoted ${email} to superuser`,
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