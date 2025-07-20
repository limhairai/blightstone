import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint cleans up orphaned database records for deleted auth users
export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First check if user exists in auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === email)
    
    if (authUser) {
      return NextResponse.json({ 
        error: 'User still exists in auth system. Delete from auth first.',
        authUserId: authUser.id 
      }, { status: 400 })
    }

    // Find orphaned records in database by email
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)

    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .eq('owner_email', email)

    let deletedRecords = []

    // Delete orphaned profiles
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', profile.id)
        
        if (!deleteError) {
          deletedRecords.push(`Profile: ${profile.id}`)
        }
      }
    }

    // Delete orphaned organizations
    if (organizations && organizations.length > 0) {
      for (const org of organizations) {
        const { error: deleteError } = await supabaseAdmin
          .from('organizations')
          .delete()
          .eq('id', org.id)
        
        if (!deleteError) {
          deletedRecords.push(`Organization: ${org.id}`)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Cleanup completed',
      email,
      deletedRecords,
      foundProfiles: profiles?.length || 0,
      foundOrganizations: organizations?.length || 0
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 