import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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

    return NextResponse.json({ competitors })
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
    } = body

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
        level,
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

    return NextResponse.json({ competitor })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}