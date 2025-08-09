import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data: creatives, error } = await supabase
      .from('creatives')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching creatives:', error)
      return NextResponse.json({ error: 'Failed to fetch creatives' }, { status: 500 })
    }

    return NextResponse.json({ creatives })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
      notes
    } = body

    if (!batch || !project_id) {
      return NextResponse.json({ error: 'Batch and project_id are required' }, { status: 400 })
    }

    const { data: creative, error } = await supabase
      .from('creatives')
      .insert({
        batch,
        status,
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
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating creative:', error)
      return NextResponse.json({ error: 'Failed to create creative' }, { status: 500 })
    }

    return NextResponse.json({ creative })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}