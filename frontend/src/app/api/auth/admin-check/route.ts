import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// TEMPORARY: Use service role as fallback until is_admin function is available
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Admin check started')
    
    // Use the same cookie pattern as other working endpoints
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🔐 User check:', { hasUser: !!user, userId: user?.id, userError: userError?.message })

    if (userError || !user) {
      console.log('🔐 No user found, returning 401')
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Try the is_admin() function first
    console.log('🔐 Calling is_admin function with user ID:', user.id)
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin', { user_id: user.id })

    console.log('🔐 is_admin function result:', { adminCheck, adminError: adminError?.message })

    let isAdmin = false

    if (adminError) {
      console.log('🔐 is_admin function failed, falling back to direct query with service role')
      
      // FALLBACK: Use service role to directly query profiles table
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('is_superuser')
        .eq('profile_id', user.id)
        .single()

      console.log('🔐 Service role fallback result:', { profile, profileError: profileError?.message })

      if (profileError) {
        console.error('🔐 Service role fallback also failed:', profileError)
        return NextResponse.json({ isAdmin: false }, { status: 500 })
      }

      isAdmin = profile?.is_superuser === true
    } else {
      isAdmin = adminCheck === true
    }

    console.log('🔐 Final admin status:', isAdmin)

    return NextResponse.json({ 
      isAdmin,
      userId: user.id,
      email: user.email,
      method: adminError ? 'service_role_fallback' : 'is_admin_function'
    })

  } catch (error) {
    console.error('🔐 Admin check error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
} 