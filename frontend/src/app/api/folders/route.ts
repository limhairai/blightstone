import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mapFieldsToDatabase, mapFieldsToFrontend } from '@/lib/field-mapping'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching folders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map database fields to frontend format
    const mappedFolders = data.map(mapFieldsToFrontend)

    return NextResponse.json(mappedFolders)
  } catch (error) {
    console.error('Error in folders GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Map frontend fields to database format
    const dbData = mapFieldsToDatabase(body)
    
    // Add server-side fields
    const folderData = {
      ...dbData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('folders')
      .insert([folderData])
      .select()
      .single()

    if (error) {
      console.error('Error creating folder:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to frontend format
    const mappedFolder = mapFieldsToFrontend(data)

    return NextResponse.json(mappedFolder)
  } catch (error) {
    console.error('Error in folders POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Map frontend fields to database format
    const dbData = mapFieldsToDatabase(updateData)
    
    const folderData = {
      ...dbData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('folders')
      .update(folderData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating folder:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to frontend format
    const mappedFolder = mapFieldsToFrontend(data)

    return NextResponse.json(mappedFolder)
  } catch (error) {
    console.error('Error in folders PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting folder:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in folders DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}