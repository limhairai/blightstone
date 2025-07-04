import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Return basic user info if profile doesn't exist
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        role: 'user',
        is_superuser: false,
        organization_id: null,
        avatar_url: user.user_metadata?.avatar_url || null
      })
    }

    return NextResponse.json({
      id: profile.profile_id,
      email: profile.email || user.email,
      name: profile.name,
      role: profile.role || 'user',
      is_superuser: profile.is_superuser || false,
      organization_id: profile.organization_id,
      avatar_url: profile.avatar_url
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 