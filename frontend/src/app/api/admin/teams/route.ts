import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch teams data from database
export async function GET(request: NextRequest) {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // Get organizations with team assignments to calculate loads
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('team_id')
      .not('team_id', 'is', null)

    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      // Proceed without load data if this fails
    }

    // Calculate team loads manually
    const loadMap = new Map();
    organizations?.forEach(org => {
      const teamId = org.team_id;
      loadMap.set(teamId, (loadMap.get(teamId) || 0) + 1);
    });

    const teamsWithStats = teams.map(team => {
      const load = loadMap.get(team.id) || 0;
      const utilization = team.capacity > 0 ? Math.round((load / team.capacity) * 100) : 0;
      const status = load >= team.capacity ? 'at_capacity' : 'active';

      return {
        ...team,
        organizationsCount: load,
        activeBusinesses: load, // Placeholder, can be refined
        utilizationRate: utilization,
        capacity: team.capacity,
        status: status,
      }
    });

    return NextResponse.json({ teams: teamsWithStats })
  } catch (error) {
    console.error('Error in GET /api/admin/teams:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert([{ name }])
      .select()
      .single()

    if (error) {
      console.error('Error creating team:', error)
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
    }

    return NextResponse.json(newTeam, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/teams:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 