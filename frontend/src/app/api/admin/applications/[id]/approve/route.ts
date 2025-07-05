import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const { admin_user_id: adminUserId, admin_notes: adminNotes } = body

    if (!adminUserId) {
      return NextResponse.json(
        { error: 'adminUserId is required' },
        { status: 400 }
      )
    }

    // Verify admin user using semantic ID
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', adminUserId)
      .single()

    if (adminError || !adminProfile?.is_superuser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update application status to processing (submitted to BlueFocus)
    // Use semantic ID column for the WHERE clause
    const { data: application, error } = await supabase
      .from('application')
      .update({
        status: 'processing',
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error approving application:', error)
      return NextResponse.json(
        { error: 'Failed to approve application' },
        { status: 500 }
      )
    }

    // Transform response to frontend format (camelCase)
    return NextResponse.json({
      success: true,
      application: {
        applicationId: application.application_id,
        status: application.status,
        approvedBy: application.approved_by,
        approvedAt: application.approved_at,
        adminNotes: application.admin_notes,
        updatedAt: application.updated_at
      }
    })

  } catch (error) {
    console.error('Error in approve application API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 