import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    
    // **PERFORMANCE**: Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // **OPTIMIZED**: Get user profile with specific fields only to reduce data transfer
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_id, email, name, role, is_superuser, organization_id, avatar_url')
      .eq('profile_id', user.id)
      .single()

    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || profile?.name || null,
      role: profile?.role || 'user',
      is_superuser: profile?.is_superuser || false,
      organization_id: profile?.organization_id || null,
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Return basic user info if profile doesn't exist
    }

    const response = NextResponse.json(userData)
    
    // **PERFORMANCE**: Add aggressive caching for user data
    response.headers.set('Cache-Control', 'private, max-age=300') // 5 minutes private cache
    response.headers.set('ETag', `"user-${user.id}-${user.updated_at || Date.now()}"`)
    
    return response

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 