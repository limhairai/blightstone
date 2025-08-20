import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users from profiles table with auth user data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        profile_id,
        name,
        email,
        is_superuser,
        created_at,
        updated_at,
        last_active
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    // Format the data for frontend
    const teamMembers = profiles?.map(profile => ({
      id: profile.profile_id,
      name: profile.name || profile.email?.split('@')[0] || 'Unknown',
      email: profile.email || '',
      isAdmin: profile.is_superuser || false,
      joinedAt: profile.created_at,
      lastActive: profile.last_active || profile.updated_at
    })) || []

    return NextResponse.json({ teamMembers })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}