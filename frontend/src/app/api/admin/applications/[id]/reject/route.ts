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
    const { admin_user_id, admin_notes } = body

    if (!admin_user_id) {
      return NextResponse.json(
        { error: 'admin_user_id is required' },
        { status: 400 }
      )
    }

    // Verify admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', admin_user_id)
      .single()

    if (adminError || !adminProfile?.is_superuser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update application status to rejected
    const { data: application, error } = await supabase
      .from('application')
      .update({
        status: 'rejected',
        rejected_by: admin_user_id,
        rejected_at: new Date().toISOString(),
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error rejecting application:', error)
      return NextResponse.json(
        { error: 'Failed to reject application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        rejected_by: application.rejected_by,
        rejected_at: application.rejected_at,
        admin_notes: application.admin_notes,
        updated_at: application.updated_at
      }
    })

  } catch (error) {
    console.error('Error in reject application API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 