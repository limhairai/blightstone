import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return basic user data for internal CRM (no profiles table needed)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || null,
      role: 'user', // Simple role for internal CRM
      is_superuser: false, // Can be enhanced later
      organization_id: null, // Not used in project-based CRM
      avatar_url: user.user_metadata?.avatar_url || null
    }

    const response = NextResponse.json(userData)
    
    // Add caching
    response.headers.set('Cache-Control', 'private, max-age=300')
    
    return response

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 