import { NextRequest, NextResponse } from 'next/server';
import { shouldEnableBmApplicationFees } from '@/lib/config/pricing-config';

export async function POST(request: NextRequest) {
  try {
    // Check if BM application fees are enabled
    if (!shouldEnableBmApplicationFees()) {
      return NextResponse.json(
        { 
          error: 'BM application fees are disabled in the current pricing model',
          message: 'Business Manager applications are now free for all plans'
        },
        { status: 400 }
      );
    }

    // If fees are enabled, this would be the legacy payment flow
    // For now, return an error since the new pricing model doesn't use fees
    return NextResponse.json(
      { 
        error: 'Payment not required',
        message: 'Business Manager applications are free in the current pricing model'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('BM application payment error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 