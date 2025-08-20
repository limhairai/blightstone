import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Admin endpoint to bulk update user names
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (!profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Update all users with Unknown/empty names to use email prefix
    const { data: updatedProfiles, error } = await supabase
      .from('profiles')
      .update({ 
        name: supabase.raw(`SPLIT_PART(email, '@', 1)`),
        updated_at: new Date().toISOString()
      })
      .or('name.is.null,name.eq.,name.eq.Unknown,name.eq.User')
      .select()

    if (error) {
      console.error('Error updating names:', error)
      return NextResponse.json({ error: 'Failed to update names' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Updated ${updatedProfiles?.length || 0} user names`,
      updatedProfiles 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}