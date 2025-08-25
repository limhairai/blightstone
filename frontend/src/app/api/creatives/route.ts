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

    // Get creatives for specific project - all authenticated users can access any project
    const { data: creatives, error } = await supabase
      .from('creatives')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching creatives:', error)
      return NextResponse.json({ error: 'Failed to fetch creatives' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseCreatives = mapArrayToFrontend(creatives || [])
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
      batch,
      status = 'draft',
      launch_date,
      ad_concept,
      test_hypothesis,
      ad_type,
      ad_variable,
      desire,
      benefit,
      objections,
      persona,
      hook_pattern,
      results,
      winning_ad_link,
      brief_link,
      drive_link,
      project_id,
      notes,
      ad_account_id,
      offer_id
    } = dbData

    if (!batch || !project_id) {
      return NextResponse.json({ error: 'Batch and project_id are required' }, { status: 400 })
    }

    const { data: creative, error } = await supabase
      .from('creatives')
      .insert({
        batch,
        status,
        launch_date: launch_date || null, // Convert empty string to null
        ad_concept,
        test_hypothesis,
        ad_type,
        ad_variable,
        desire,
        benefit,
        objections,
        persona,
        hook_pattern,
        results,
        winning_ad_link,
        brief_link,
        drive_link,
        project_id,
        notes,
        ad_account_id: ad_account_id || null,
        offer_id: offer_id || null,
        created_by: user.email
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
      batch,
      status,
      launch_date,
      campaign_concept,
      batch_number,
      campaign_id,
      test_hypothesis,
      ad_type,
      ad_variable,
      desire,
      benefit,
      objections,
      persona,
      hook_pattern,
      results,
      winning_ad_link,
      brief_link,
      drive_link,
      notes,
      ad_account_id,
      offer_id
    } = dbData

    if (!id || !batch) {
      return NextResponse.json({ error: 'ID and batch are required' }, { status: 400 })
    }

    const { data: creative, error } = await supabase
      .from('creatives')
      .update({
        batch,
        status,
        launch_date: launch_date || null,
        campaign_concept,
        batch_number: batch_number || 1,
        campaign_id,
        test_hypothesis,
        ad_type,
        ad_variable,
        desire,
        benefit,
        objections,
        persona,
        hook_pattern,
        results,
        winning_ad_link,
        brief_link,
        drive_link,
        notes,
        ad_account_id: ad_account_id || null,
        offer_id: offer_id || null
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Creative ID is required' }, { status: 400 })
    }

    // First, verify the creative belongs to the user by checking the project
    const { data: creative, error: fetchError } = await supabase
      .from('creatives')
      .select('id, project_id')
      .eq('id', id)
      .single()

    if (fetchError || !creative) {
      return NextResponse.json({ error: 'Creative not found' }, { status: 404 })
    }

    // Verify the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', creative.project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the creative
    const { error } = await supabase
      .from('creatives')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting creative:', error)
      return NextResponse.json({ error: 'Failed to delete creative' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}