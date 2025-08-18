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

    // Get ad accounts for specific project
    const { data: adAccounts, error } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ad accounts:', error)
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseAdAccounts = mapArrayToFrontend(adAccounts || [])
    return NextResponse.json({ adAccounts: camelCaseAdAccounts })
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
      business_manager,
      project_id
    } = dbData

    if (!name || !business_manager || !project_id) {
      return NextResponse.json({ error: 'Name, business manager, and project_id are required' }, { status: 400 })
    }

    const { data: adAccount, error } = await supabase
      .from('ad_accounts')
      .insert({
        name,
        business_manager,
        project_id,
        created_by: user.email
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating ad account:', error)
      return NextResponse.json({ error: 'Failed to create ad account' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseAdAccount = mapFieldsToFrontend(adAccount)
    return NextResponse.json({ adAccount: camelCaseAdAccount })
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
      business_manager
    } = dbData

    if (!id || !name || !business_manager) {
      return NextResponse.json({ error: 'ID, name, and business manager are required' }, { status: 400 })
    }

    const { data: adAccount, error } = await supabase
      .from('ad_accounts')
      .update({
        name,
        business_manager
      })
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only update their own ad accounts
      .select()
      .single()

    if (error) {
      console.error('Error updating ad account:', error)
      return NextResponse.json({ error: 'Failed to update ad account' }, { status: 500 })
    }

    // Convert database snake_case to frontend camelCase
    const camelCaseAdAccount = mapFieldsToFrontend(adAccount)
    return NextResponse.json({ adAccount: camelCaseAdAccount })
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
      return NextResponse.json({ error: 'Ad account ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', id)
      .eq('created_by', user.email) // Ensure user can only delete their own ad accounts

    if (error) {
      console.error('Error deleting ad account:', error)
      return NextResponse.json({ error: 'Failed to delete ad account' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}