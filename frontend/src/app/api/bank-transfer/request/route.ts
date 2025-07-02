import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split('Bearer ')[1]
    
    if (!token) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
    }

    const { amount, notes } = await request.json()

    if (!amount || amount < 50 || amount > 50000) {
      return NextResponse.json({ 
        error: 'Amount must be between $50 and $50,000' 
      }, { status: 400 })
    }

    // Get user's organization
    const { data: org, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('bank_transfer_requests')
      .select('id')
      .eq('organization_id', org.organization_id)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'You already have a pending bank transfer request' 
      }, { status: 400 })
    }

    // Create bank transfer request
    const { data: bankRequest, error: createError } = await supabase
      .from('bank_transfer_requests')
      .insert({
        organization_id: org.organization_id,
        user_id: user.id,
        requested_amount: amount,
        status: 'pending',
        user_notes: notes,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating bank transfer request:', createError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Generate unique reference number for the transfer
    const referenceNumber = `ADHUB-${bankRequest.id.slice(0, 8).toUpperCase()}`

    // Update request with reference number
    await supabase
      .from('bank_transfer_requests')
      .update({ reference_number: referenceNumber })
      .eq('id', bankRequest.id)

    return NextResponse.json({
      success: true,
      request: {
        id: bankRequest.id,
        amount: amount,
        referenceNumber,
        bankDetails: {
          bankName: process.env.COMPANY_BANK_NAME || 'Your Bank Name',
          accountName: process.env.COMPANY_BANK_ACCOUNT_NAME || 'AdHub Inc.',
          accountNumber: process.env.COMPANY_BANK_ACCOUNT_NUMBER || '****1234',
          routingNumber: process.env.COMPANY_BANK_ROUTING_NUMBER || '****5678',
          wireInstructions: 'Please include the reference number in the transfer description'
        }
      }
    })

  } catch (error) {
    console.error('Error creating bank transfer request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 