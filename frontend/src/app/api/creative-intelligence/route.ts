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
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get creative intelligence for specific project - all authenticated users can access any project
    const { data: creativeIntelligence, error } = await supabase
      .from('creative_intelligence')
      .select('*')
      .eq('project_id', projectId)
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

    // In shared system, no need to verify project ownership - all users can access shared data

    const { data: creative, error } = await supabase
      .from('creative_intelligence')
      .insert({
        project_id,
        created_by: user.email || user.id,
        title,
        platform: platform || 'facebook',
        image_url: image_url ?? null,
        video_url: video_url ?? null,
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
        image_url: image_url ?? null,
        video_url: video_url ?? null,
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
      // In shared system, all users can update all creatives
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

    // Get ID from URL parameters (consistent with other delete endpoints)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('creative_intelligence')
      .delete()
      .eq('id', id)
      // In shared system, all users can delete all creatives

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