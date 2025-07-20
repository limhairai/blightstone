import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { planId, organizationId } = await request.json()

    if (!planId || !organizationId) {
      return NextResponse.json({ error: 'Plan ID and Organization ID are required' }, { status: 400 })
    }

    // For testing - return a mock success response
    console.log(`🧪 TEST: Would create checkout for plan ${planId} for org ${organizationId}`)
    
    return NextResponse.json({ 
      url: `http://localhost:3000/dashboard/settings?test=true&plan=${planId}`,
      message: 'Test checkout - redirecting to settings with test parameter'
    })

  } catch (error) {
    console.error('Test checkout error:', error)
    return NextResponse.json({ error: 'Test checkout failed' }, { status: 500 })
  }
} 