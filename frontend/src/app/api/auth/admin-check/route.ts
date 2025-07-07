import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Use the is_admin() function to avoid RLS recursion
    // This function uses SECURITY DEFINER to bypass RLS policies
    console.log('🔐 Calling is_admin function with user ID:', user.id)
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin', { user_id: user.id })

    console.log('🔐 is_admin function result:', { adminCheck, adminError: adminError?.message })

    if (adminError) {
      console.error('🔐 Error checking admin status:', adminError)
      return NextResponse.json({ isAdmin: false }, { status: 500 })
    }

    const isAdmin = adminCheck === true
    console.log('🔐 Final admin status:', isAdmin)

    return NextResponse.json({ 
      isAdmin,
      userId: user.id,
      email: user.email 
    })

  } catch (error) {
    console.error('🔐 Admin check error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
} 