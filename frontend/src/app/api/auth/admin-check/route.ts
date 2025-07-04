import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
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

    // Check if user is admin in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (profileError) {
      console.error('Error checking admin status:', profileError)
      return NextResponse.json({ isAdmin: false }, { status: 500 })
    }

    const isAdmin = profile?.is_superuser === true

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