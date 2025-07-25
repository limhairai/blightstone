import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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

    const { amount } = await request.json()

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

    // No rate limiting - users can create multiple bank transfer requests
    // Each request gets a unique reference number for tracking
    // This matches the behavior of crypto exchanges and Stripe checkout

    // Generate request ID for reference number generation
    const requestId = crypto.randomUUID()

    // Generate unique reference number that Airwallex can match
    // Format: ADHUB-{ORG_ID_SHORT}-{REQUEST_ID_SHORT}-{CHECKSUM}
    const orgIdShort = org.organization_id.slice(0, 8).toUpperCase()
    const requestIdShort = requestId.slice(0, 8).toUpperCase()
    const checksum = Math.abs(hashCode(`${org.organization_id}-${requestId}`)).toString().slice(0, 4)
    const referenceNumber = `ADHUB-${orgIdShort}-${requestIdShort}-${checksum}`

    // Create bank transfer request with reference number
    const { data: bankRequest, error: createError } = await supabase
      .from('bank_transfer_requests')
      .insert({
        request_id: requestId,
        organization_id: org.organization_id,
        user_id: user.id,
        requested_amount: amount,
        reference_number: referenceNumber,
        status: 'pending',
        user_notes: null,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating bank transfer request:', createError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    // Return bank details and instructions
    return NextResponse.json({
      success: true,
      request: {
        id: bankRequest.request_id,
        amount: amount,
        referenceNumber,
        status: 'pending',
        created_at: bankRequest.created_at
      },
      bankDetails: {
        // Your company's Airwallex bank account details
        accountName: process.env.AIRWALLEX_ACCOUNT_NAME || 'BLIGHTSTONE PTE. LTD.',
        bankName: process.env.AIRWALLEX_BANK_NAME || 'Community Federal Savings Bank',
        accountNumber: process.env.AIRWALLEX_ACCOUNT_NUMBER || '8489875843',
        routingNumber: process.env.AIRWALLEX_ROUTING_NUMBER || '026073150', // ACH routing
        fedwireRoutingNumber: process.env.AIRWALLEX_FEDWIRE_ROUTING || '026073008',
        swiftCode: process.env.AIRWALLEX_SWIFT_CODE || 'CMFGUS33',
        accountLocation: 'United States of America',
        
        // Critical: Reference number for matching
        referenceNumber: referenceNumber,
        
        // Instructions
        instructions: [
          `IMPORTANT: Include reference number "${referenceNumber}" in the transfer description/memo`,
          'Transfer will be processed within 1-3 business days after receipt',
          'Your wallet will be automatically credited when transfer is confirmed',
          'Contact support if you have any issues with the transfer'
        ],
        
        // Fees and timing
        fees: 'No fees charged by AdHub (bank fees may apply)',
        processingTime: '1-3 business days',
        minimumAmount: '$50',
        maximumAmount: '$50,000'
      }
    })

  } catch (error) {
    console.error('Error creating bank transfer request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple hash function for generating reference checksums
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
} 