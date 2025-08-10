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

    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching personas:', error)
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCasePersonas = mapArrayToFrontend(personas || [])
    return NextResponse.json({ personas: camelCasePersonas })
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
      age_gender_location,
      daily_struggles,
      desired_characteristics,
      desired_social_status,
      product_help_achieve_status,
      beliefs_to_overcome,
      failed_solutions,
      market_awareness,
      market_sophistication,
      insecurities,
      mindset,
      deeper_pain_points,
      hidden_specific_desires,
      objections,
      angle,
      domino_statement,
      project_id,
      notes
    } = dbData

    if (!name || !project_id) {
      return NextResponse.json({ error: 'Name and project_id are required' }, { status: 400 })
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        name,
        age_gender_location,
        daily_struggles,
        desired_characteristics,
        desired_social_status,
        product_help_achieve_status,
        beliefs_to_overcome,
        failed_solutions,
        market_awareness,
        market_sophistication,
        insecurities,
        mindset,
        deeper_pain_points,
        hidden_specific_desires,
        objections,
        angle,
        domino_statement,
        project_id,
        notes,
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating persona:', error)
      return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCasePersona = mapFieldsToFrontend(persona)
    return NextResponse.json({ persona: camelCasePersona })
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
      name,
      age_gender_location,
      daily_struggles,
      desired_characteristics,
      desired_social_status,
      product_help_achieve_status,
      beliefs_to_overcome,
      failed_solutions,
      market_awareness,
      market_sophistication,
      insecurities,
      mindset,
      deeper_pain_points,
      hidden_specific_desires,
      objections,
      angle,
      domino_statement,
      notes
    } = dbData

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .update({
        name,
        age_gender_location,
        daily_struggles,
        desired_characteristics,
        desired_social_status,
        product_help_achieve_status,
        beliefs_to_overcome,
        failed_solutions,
        market_awareness,
        market_sophistication,
        insecurities,
        mindset,
        deeper_pain_points,
        hidden_specific_desires,
        objections,
        angle,
        domino_statement,
        notes
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own personas
      .select()
      .single()

    if (error) {
      console.error('Error updating persona:', error)
      return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCasePersona = mapFieldsToFrontend(persona)
    return NextResponse.json({ persona: camelCasePersona })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}