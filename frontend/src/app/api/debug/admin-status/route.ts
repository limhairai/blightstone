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
      // Check profile in database using admin client for debugging
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('profile_id, email, name, role, is_superuser, created_at')
        .eq('profile_id', user.id)
        .single()

      debugInfo.profile = {
        found: !!profile,
        data: profile || null,
        error: profileError?.message || null
      }

      // Also check with regular client
      const { data: profileRegular, error: profileRegularError } = await supabase
        .from('profiles')
        .select('profile_id, email, name, role, is_superuser')
        .eq('profile_id', user.id)
        .single()

      debugInfo.profileRegularClient = {
        found: !!profileRegular,
        data: profileRegular || null,
        error: profileRegularError?.message || null
      }

      // Test the is_admin() function to avoid RLS recursion
      const { data: adminCheck, error: adminError } = await supabase
        .rpc('is_admin', { user_id: user.id })

      debugInfo.isAdminFunction = {
        result: adminCheck,
        error: adminError?.message || null
      }
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 