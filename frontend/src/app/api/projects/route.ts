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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseProjects = mapArrayToFrontend(projects || [])
    return NextResponse.json({ projects: camelCaseProjects })
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
    const { name, description, status = 'active' } = dbData

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        status,
        user_id: user.id,
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseProject = mapFieldsToFrontend(project)
    return NextResponse.json({ project: camelCaseProject })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}