import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    // For internal CRM, we can make all authenticated users "admin"
    // Or you can implement proper admin role checking here
    return NextResponse.json({ isAdmin: true }, { status: 200 })
    
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}