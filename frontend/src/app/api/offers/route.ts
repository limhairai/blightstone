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

    // Get offers for specific project
    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching offers:', error)
      return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseOffers = mapArrayToFrontend(offers || [])
    return NextResponse.json({ offers: camelCaseOffers })
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
      price,
      url,
      description,
      project_id
    } = dbData

    if (!name || !price || !project_id) {
      return NextResponse.json({ error: 'Name, price, and project_id are required' }, { status: 400 })
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        name,
        price,
        url: url || null,
        description: description || null,
        project_id,
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating offer:', error)
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseOffer = mapFieldsToFrontend(offer)
    return NextResponse.json({ offer: camelCaseOffer })
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
      price,
      url
    } = dbData

    if (!id || !name || !price) {
      return NextResponse.json({ error: 'ID, name, and price are required' }, { status: 400 })
    }

    const { data: offer, error } = await supabase
      .from('offers')
      .update({
        name,
        price,
        url: url || null
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own offers
      .select()
      .single()

    if (error) {
      console.error('Error updating offer:', error)
      return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseOffer = mapFieldsToFrontend(offer)
    return NextResponse.json({ offer: camelCaseOffer })
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
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only delete their own offers

    if (error) {
      console.error('Error deleting offer:', error)
      return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}