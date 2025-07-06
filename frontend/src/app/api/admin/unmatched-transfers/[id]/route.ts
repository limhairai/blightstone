import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
    }

    // Verify admin user
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single()

    if (adminError || !adminProfile?.is_superuser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { status } = await request.json()
    const unmatchedId = params.id

    if (!['completed', 'matched', 'ignored', 'failed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Map frontend status to database status
    const dbStatus = status === 'completed' ? 'matched' : status === 'failed' ? 'ignored' : status

    // Update the unmatched transfer status
    const { data: updatedTransfer, error: updateError } = await supabase
      .from('unmatched_transfers')
      .update({
        status: dbStatus,
        processed_at: new Date().toISOString()
      })
      .eq('unmatched_id', unmatchedId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating unmatched transfer:', updateError)
      return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      transfer: updatedTransfer 
    })

  } catch (error) {
    console.error('Error in unmatched transfer update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 