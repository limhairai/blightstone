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

    // Get ALL creative intelligence for shared view - no project filtering
    const { data: creativeIntelligence, error } = await supabase
      .from('creative_intelligence')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching creative intelligence:', error)
      return NextResponse.json({ error: 'Failed to fetch creative intelligence' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCreatives = mapArrayToFrontend(creativeIntelligence || [])
    
    return NextResponse.json({ creatives: camelCaseCreatives })
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
      project_id,
      title,
      platform,
      image_url,
      video_url,
      creative_type,
      headline,
      primary_copy,
      hook,
      call_to_action,
      concept,
      angle,
      hook_pattern,
      visual_style,
      target_emotion,
      creative_category,
      performance_notes,
      psychology_trigger,
      scalability_notes,
      remix_potential,
      tags,
      is_template,
      template_variables,
      status
    } = dbData

    if (!project_id || !title) {
      return NextResponse.json({ error: 'Project ID and title are required' }, { status: 400 })
    }

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', project_id)
      .single()
    
    if (projectError || !project) {
      console.error('Project not found:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    if (project.user_id !== user.id) {
      console.error('Project does not belong to user')
      return NextResponse.json({ error: 'Project does not belong to user' }, { status: 403 })
    }

    const { data: creative, error } = await supabase
      .from('creative_intelligence')
      .insert({
        project_id,
        created_by: user.email || user.id,
        title,
        platform: platform || 'facebook',
        image_url,
        video_url,
        creative_type: creative_type || 'image',
        headline,
        primary_copy,
        hook,
        call_to_action,
        concept,
        angle,
        hook_pattern,
        visual_style,
        target_emotion,
        creative_category: creative_category || 'concept_gold',
        performance_notes,
        psychology_trigger,
        scalability_notes,
        remix_potential,
        tags: tags || [],
        is_template: is_template || false,
        template_variables,
        status: status || 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating creative:', error)
      return NextResponse.json({ error: 'Failed to create creative' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCreative = mapFieldsToFrontend(creative)
    return NextResponse.json({ creative: camelCaseCreative })
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
    const { 
      id,
      title,
      platform,
      image_url,
      video_url,
      creative_type,
      headline,
      primary_copy,
      hook,
      call_to_action,
      concept,
      angle,
      hook_pattern,
      visual_style,
      target_emotion,
      creative_category,
      performance_notes,
      psychology_trigger,
      scalability_notes,
      remix_potential,
      tags,
      is_template,
      template_variables,
      status
    } = dbData

    if (!id || !title) {
      return NextResponse.json({ error: 'ID and title are required' }, { status: 400 })
    }

    const { data: creative, error } = await supabase
      .from('creative_intelligence')
      .update({
        title,
        platform: platform || 'facebook',
        image_url,
        video_url,
        creative_type: creative_type || 'image',
        headline,
        primary_copy,
        hook,
        call_to_action,
        concept,
        angle,
        hook_pattern,
        visual_style,
        target_emotion,
        creative_category: creative_category || 'concept_gold',
        performance_notes,
        psychology_trigger,
        scalability_notes,
        remix_potential,
        tags: tags || [],
        is_template: is_template || false,
        template_variables,
        status: status || 'active'
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own creatives
      .select()
      .single()

    if (error) {
      console.error('Error updating creative:', error)
      return NextResponse.json({ error: 'Failed to update creative' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCreative = mapFieldsToFrontend(creative)
    return NextResponse.json({ creative: camelCaseCreative })
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

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('creative_intelligence')
      .delete()
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only delete their own creatives

    if (error) {
      console.error('Error deleting creative:', error)
      return NextResponse.json({ error: 'Failed to delete creative' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Creative deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}