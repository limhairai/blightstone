import { NextRequest, NextResponse } from 'next/server'
import { buildApiUrl } from '@/lib/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentIntentId = params.id
    
    // In production, this would fetch from your backend
    // Using centralized API config
    
    const response = await fetch(
      buildApiUrl(`/api/payments/intent/${paymentIntentId}`),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }
    
    const paymentIntent = await response.json()
    
    return NextResponse.json(paymentIntent)
  } catch (error) {
    console.error('Error fetching payment intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 