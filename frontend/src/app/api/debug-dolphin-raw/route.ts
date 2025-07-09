import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    
    if (!accountId) {
      return NextResponse.json({ error: 'account_id parameter is required' }, { status: 400 });
    }

    const DOLPHIN_API_URL = process.env.DOLPHIN_API_URL || 'https://cloud.dolphin.tech';
    const DOLPHIN_API_KEY = process.env.DOLPHIN_API_KEY;

    if (!DOLPHIN_API_KEY) {
      return NextResponse.json({ error: 'Dolphin API key not configured' }, { status: 500 });
    }

    // Fetch all CABs (ad accounts) to find the specific one
    const cabsResponse = await fetch(`${DOLPHIN_API_URL}/api/v1/fb-cabs?perPage=100&page=1&currency=USD&showArchivedAdAccount=1&with_trashed=1`, {
      headers: {
        'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!cabsResponse.ok) {
      throw new Error(`Dolphin API error: ${cabsResponse.status} ${cabsResponse.statusText}`);
    }

    const cabsData = await cabsResponse.json();
    const cabs = cabsData.data || [];

    // Find the specific ad account
    const targetAccount = cabs.find((cab: any) => 
      cab.id === accountId || 
      cab.ad_account_id === accountId ||
      cab.name === accountId
    );

    if (!targetAccount) {
      return NextResponse.json({ 
        error: 'Account not found',
        searched_for: accountId,
        total_accounts: cabs.length,
        sample_account_names: cabs.slice(0, 5).map((cab: any) => cab.name)
      }, { status: 404 });
    }

    // Also fetch all profiles to see BM associations from that side
    const profilesResponse = await fetch(`${DOLPHIN_API_URL}/api/v1/fb-accounts?perPage=100&page=1`, {
      headers: {
        'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let profilesData = null;
    if (profilesResponse.ok) {
      profilesData = await profilesResponse.json();
    }

    // Also try to fetch business managers directly if there's an endpoint
    const bmResponse = await fetch(`${DOLPHIN_API_URL}/api/v1/fb-businesses?perPage=100&page=1&currency=USD&with_trashed=1`, {
      headers: {
        'Authorization': `Bearer ${DOLPHIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    let bmData = null;
    if (bmResponse.ok) {
      bmData = await bmResponse.json();
    }

    return NextResponse.json({
      success: true,
      account_found: {
        id: targetAccount.id,
        name: targetAccount.name,
        ad_account_id: targetAccount.ad_account_id,
        status: targetAccount.status,
        balance: targetAccount.balance,
        currency: targetAccount.currency,
        // BM association fields
        bm: targetAccount.bm,
        business: targetAccount.business,
        business_id: targetAccount.business_id,
        // Managing profiles
        accounts: targetAccount.accounts,
        // Full raw data
        raw_data: targetAccount
      },
      profiles_data: profilesData,
      business_managers_data: bmData,
      dolphin_endpoints_tested: [
        '/api/v1/fb-cabs',
        '/api/v1/fb-accounts',
        '/api/v1/fb-businesses'
      ]
    });

  } catch (error) {
    console.error('Error fetching Dolphin data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 