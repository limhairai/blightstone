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
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get the application to verify ownership
    const { data: application, error: appError } = await supabase
      .from('application')
      .select('application_id, organization_id, status')
      .eq('application_id', id)
      .single()

    if (appError || !application) {
      console.error('Application lookup failed:', {
        appError,
        application,
        applicationId: id
      })
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Verify the user has access to this organization
    const { data: orgMembership, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', application.organization_id)
      .single()

    if (orgError || !orgMembership) {
      console.error('Organization membership check failed:', {
        orgError,
        orgMembership,
        userId: user.id,
        organizationId: application.organization_id
      })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if application can be cancelled/deleted
    const deletableStatuses = ['pending', 'rejected']
    const cancellableStatuses = ['pending', 'processing']
    
    if (!deletableStatuses.includes(application.status) && !cancellableStatuses.includes(application.status)) {
      return NextResponse.json({ 
        error: 'Cannot cancel this application',
        message: 'Only pending, processing, or rejected applications can be cancelled or deleted.'
      }, { status: 400 })
    }

    // For rejected applications, delete them completely
    if (application.status === 'rejected') {
      const { error: deleteError } = await supabase
        .from('application')
        .delete()
        .eq('application_id', id)

      if (deleteError) {
        console.error('Error deleting application:', deleteError)
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Application deleted successfully',
        action: 'deleted'
      })
    }

    // For pending/processing applications, mark as cancelled
    const { data: updatedApplication, error: updateError } = await supabase
      .from('application')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error cancelling application:', updateError)
      return NextResponse.json({ error: 'Failed to cancel application' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Application cancelled successfully',
      action: 'cancelled',
      application: {
        applicationId: updatedApplication.application_id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updated_at
      }
    })

  } catch (error) {
    console.error('Error in cancel application API:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 