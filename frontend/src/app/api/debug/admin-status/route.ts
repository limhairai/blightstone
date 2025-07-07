import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Admin client for debugging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🐛 DEBUG ENDPOINT CALLED - This should appear in Render logs!')
    console.log('🐛 Timestamp:', new Date().toISOString())
    console.log('🐛 Environment:', process.env.NODE_ENV)
    
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

    // Get the current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('🐛 User from session:', { hasUser: !!user, userId: user?.id, userError: userError?.message })

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      userError: userError?.message || null,
      cookies: {
        totalCookies: cookieStore.getAll().length,
        cookieNames: cookieStore.getAll().map(c => c.name),
        hasSupabaseCookies: cookieStore.getAll().some(c => c.name.includes('supabase'))
      }
    }

    if (user) {
      console.log('🐛 Checking profile with admin client...')
      // Check profile in database using admin client for debugging
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('profile_id, email, name, role, is_superuser, created_at')
        .eq('profile_id', user.id)
        .single()

      console.log('🐛 Profile from admin client:', { profile, profileError: profileError?.message })

      debugInfo.profile = {
        found: !!profile,
        data: profile || null,
        error: profileError?.message || null
      }

      console.log('🐛 Checking profile with regular client...')
      // Also check with regular client
      const { data: profileRegular, error: profileRegularError } = await supabase
        .from('profiles')
        .select('profile_id, email, name, role, is_superuser')
        .eq('profile_id', user.id)
        .single()

      console.log('🐛 Profile from regular client:', { profileRegular, profileRegularError: profileRegularError?.message })

      debugInfo.profileRegularClient = {
        found: !!profileRegular,
        data: profileRegular || null,
        error: profileRegularError?.message || null
      }

      console.log('🐛 Testing is_admin function...')
      // Test the is_admin() function to avoid RLS recursion
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id })

      console.log('🐛 is_admin function result:', { adminCheck, adminError: adminError?.message })

      debugInfo.isAdminFunction = {
        result: adminCheck,
        error: adminError?.message || null
      }
    }

    console.log('🐛 Final debug info:', JSON.stringify(debugInfo, null, 2))
    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('🐛 DEBUG ENDPOINT ERROR:', error)
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 