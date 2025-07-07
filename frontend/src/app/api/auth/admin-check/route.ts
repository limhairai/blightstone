import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Use the is_admin() function to avoid RLS recursion
    // This function uses SECURITY DEFINER to bypass RLS policies
    const { data: adminCheck, error: adminError } = await supabase
      .rpc('is_admin', { user_id: user.id })

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      return NextResponse.json({ isAdmin: false }, { status: 500 })
    }

    const isAdmin = adminCheck === true

    return NextResponse.json({ 
      isAdmin,
      userId: user.id,
      email: user.email 
    })

  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
} 