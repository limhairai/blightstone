import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Setup teams table and initial data
export async function POST(request: NextRequest) {
  try {
    // First, try to create the teams table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.teams (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          main_facebook_profile TEXT,
          backup_facebook_profile_1 TEXT,
          backup_facebook_profile_2 TEXT,
          max_organizations INTEGER DEFAULT 20,
          current_organizations_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    })
    
    if (createError) {
      console.error('Error creating teams table:', createError)
    }

    // Add team_id column to organizations if it doesn't exist
    const alterTableQuery = `
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);
    `
    
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: alterTableQuery 
    })
    
    if (alterError) {
      console.error('Error adding team_id column:', alterError)
    }

    // Create initial team
    const { data: existingTeams, error: checkError } = await supabase
      .from('teams')
      .select('id')
      .limit(1)

    if (!checkError && (!existingTeams || existingTeams.length === 0)) {
      const { error: insertError } = await supabase
        .from('teams')
        .insert([
          {
            name: 'Team Alpha',
            description: 'Initial team for Facebook profile management',
            max_organizations: 20,
            current_organizations_count: 0,
            status: 'active'
          }
        ])

      if (insertError) {
        console.error('Error creating initial team:', insertError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Teams table setup completed' 
    })
  } catch (error) {
    console.error('Error setting up teams:', error)
    return NextResponse.json(
      { error: 'Failed to setup teams table' },
      { status: 500 }
    )
  }
} 