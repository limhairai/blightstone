import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { mapFieldsToDatabase, mapFieldsToFrontend, mapArrayToFrontend } from '@/lib/field-mapping'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data: competitors, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching competitors:', error)
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCompetitors = mapArrayToFrontend(competitors || [])
    return NextResponse.json({ competitors: camelCaseCompetitors })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // Convert frontend camelCase to database snake_case
    const dbData = mapFieldsToDatabase(body)
    const { 
      name,
      website_url,
      ad_library_link,
      market,
      offer_url,
      traffic_volume,
      level,
      project_id,
      notes
    } = dbData

    if (!name || !project_id) {
      return NextResponse.json({ error: 'Name and project_id are required' }, { status: 400 })
    }

    const { data: competitor, error } = await supabase
      .from('competitors')
      .insert({
        name,
        website_url,
        ad_library_link,
        market,
        offer_url,
        traffic_volume,
        level: level?.toLowerCase() || 'medium', // Convert to lowercase for DB constraint
        project_id,
        notes,
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating competitor:', error)
      return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCompetitor = mapFieldsToFrontend(competitor)
    return NextResponse.json({ competitor: camelCaseCompetitor })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // Convert frontend camelCase to database snake_case
    const dbData = mapFieldsToDatabase(body)
    const { id, name, website_url, ad_library_link, market, offer_url, traffic_volume, level, notes } = dbData

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data: competitor, error } = await supabase
      .from('competitors')
      .update({
        name,
        website_url,
        ad_library_link,
        market,
        offer_url,
        traffic_volume,
        level: level?.toLowerCase() || 'medium', // Convert to lowercase for DB constraint
        notes
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own competitors
      .select()
      .single()

    if (error) {
      console.error('Error updating competitor:', error)
      return NextResponse.json({ error: 'Failed to update competitor' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCompetitor = mapFieldsToFrontend(competitor)
    return NextResponse.json({ competitor: camelCaseCompetitor })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Competitor ID is required' }, { status: 400 })
    }

    // First, verify the competitor belongs to the user by checking the project
    const { data: competitor, error: fetchError } = await supabase
      .from('competitors')
      .select('id, project_id')
      .eq('id', id)
      .single()

    if (fetchError || !competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', competitor.project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the competitor
    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting competitor:', error)
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}