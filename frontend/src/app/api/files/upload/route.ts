import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { mapFieldsToFrontend } from '@/lib/field-mapping'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string
    const folderId = formData.get('folder_id') as string | null
    const offerId = formData.get('offer_id') as string | null
    const adAccountId = formData.get('ad_account_id') as string | null
    const category = formData.get('category') as string || 'general'
    const description = formData.get('description') as string || ''
    const tags = formData.get('tags') as string || ''
    const createdBy = formData.get('created_by') as string

    if (!file || !projectId || !createdBy) {
      return NextResponse.json(
        { error: 'File, project_id, and created_by are required' },
        { status: 400 }
      )
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `${projectId}/${category}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Create file record in database
    const fileRecord = {
      name: fileName,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      project_id: projectId,
      folder_id: folderId || null,
      offer_id: offerId || null,
      ad_account_id: adAccountId || null,
      category,
      description: description || null,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: dbData, error: dbError } = await supabase
      .from('files')
      .insert([fileRecord])
      .select()
      .single()

    if (dbError) {
      console.error('Error creating file record:', dbError)
      
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('files')
        .remove([filePath])
      
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Get signed URL for immediate access
    const { data: signedUrlData } = await supabase.storage
      .from('files')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    // Map database fields to frontend format
    const mappedData = mapFieldsToFrontend(dbData)
    
    return NextResponse.json({
      ...mappedData,
      signedUrl: signedUrlData?.signedUrl
    })
  } catch (error) {
    console.error('Error in file upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}