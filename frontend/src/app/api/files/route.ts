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
    const offerId = searchParams.get('offer_id')
    const adAccountId = searchParams.get('ad_account_id')
    const category = searchParams.get('category')

    let query = supabase
      .from('files')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (offerId) {
      query = query.eq('offer_id', offerId)
    }
    if (adAccountId) {
      query = query.eq('ad_account_id', adAccountId)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map database fields to frontend format
    const mappedFiles = data.map(mapFieldsToFrontend)

    return NextResponse.json(mappedFiles)
  } catch (error) {
    console.error('Error in files GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Map frontend fields to database format
    const dbData = mapFieldsToDatabase(body)
    
    // Add server-side fields
    const fileData = {
      ...dbData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('files')
      .insert([fileData])
      .select()
      .single()

    if (error) {
      console.error('Error creating file record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to frontend format
    const mappedFile = mapFieldsToFrontend(data)

    return NextResponse.json(mappedFile)
  } catch (error) {
    console.error('Error in files POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    // Map frontend fields to database format
    const dbData = mapFieldsToDatabase(updateData)
    
    const fileData = {
      ...dbData,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('files')
      .update(fileData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating file:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map back to frontend format
    const mappedFile = mapFieldsToFrontend(data)

    return NextResponse.json(mappedFile)
  } catch (error) {
    console.error('Error in files PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // First get the file to delete from storage
    const { data: fileRecord, error: fetchError } = await supabase
      .from('files')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching file for deletion:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Delete from storage
    if (fileRecord?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileRecord.file_path])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting file record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in files DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}