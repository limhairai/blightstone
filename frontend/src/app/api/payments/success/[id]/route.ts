import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentIntentId = params.id
    
    // In production, this would fetch from your backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(
      `${backendUrl}/api/payments/success/${paymentIntentId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Payment details not found' },
        { status: 404 }
      )
    }
    
    const paymentDetails = await response.json()
    
    return NextResponse.json(paymentDetails)
  } catch (error) {
    console.error('Error fetching payment success details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 