import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
    const requestId = params.id

    if (!['completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update the bank transfer request status
    const { data: updatedRequest, error: updateError } = await supabase
      .from('bank_transfer_requests')
      .update({
        status,
        processed_at: new Date().toISOString()
        // updated_at will be automatically updated by trigger
      })
      .eq('request_id', requestId)
      .select(`
        *,
        organization:organizations(name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating bank transfer request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If marking as completed, we should credit the wallet
    if (status === 'completed') {
      try {
        // Call the wallet service to process the topup
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wallet/process-topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.BACKEND_SERVICE_TOKEN}`
          },
          body: JSON.stringify({
            organization_id: updatedRequest.organization_id,
            amount_cents: updatedRequest.actual_amount || updatedRequest.requested_amount,
            description: `Bank transfer - ${updatedRequest.reference_number}`,
            reference_id: updatedRequest.request_id,
            transaction_type: 'bank_transfer'
          })
        })

        if (!response.ok) {
          console.error('Failed to process wallet topup:', await response.text())
          // Don't fail the request, just log the error
        }
      } catch (error) {
        console.error('Error processing wallet topup:', error)
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest 
    })

  } catch (error) {
    console.error('Error in bank transfer update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 