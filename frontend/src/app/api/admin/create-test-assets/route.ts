import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Create test Business Managers
    const businessManagers = [
      {
        type: 'business_manager',
        dolphin_id: 'BM_001_TEST',
        name: 'Test Business Manager 1',
        status: 'active',
        metadata: {
          ad_account_count: 3,
          team: 'A-Admin-1',
          provider: 'BlueFocus'
        }
      },
      {
        type: 'business_manager', 
        dolphin_id: 'BM_002_TEST',
        name: 'Test Business Manager 2',
        status: 'active',
        metadata: {
          ad_account_count: 2,
          team: 'B-Backup-1',
          provider: 'BlueFocus'
        }
      }
    ];

    // Create test Ad Accounts
    const adAccounts = [
      // Ad Accounts for BM_001_TEST
      {
        type: 'ad_account',
        dolphin_id: 'AD_001_TEST',
        name: 'Test Ad Account 1',
        status: 'active',
        metadata: {
          business_manager_id: 'BM_001_TEST',
          business_manager_name: 'Test Business Manager 1',
          ad_account_id: '123456789',
          spend_cap: 100000, // $1000 in cents
          amount_spent: 250,
          timezone_id: 'America/New_York'
        }
      },
      {
        type: 'ad_account',
        dolphin_id: 'AD_002_TEST',
        name: 'Test Ad Account 2', 
        status: 'active',
        metadata: {
          business_manager_id: 'BM_001_TEST',
          business_manager_name: 'Test Business Manager 1',
          ad_account_id: '123456790',
          spend_cap: 50000, // $500 in cents
          amount_spent: 100,
          timezone_id: 'America/New_York'
        }
      },
      {
        type: 'ad_account',
        dolphin_id: 'AD_003_TEST',
        name: 'Test Ad Account 3',
        status: 'active',
        metadata: {
          business_manager_id: 'BM_001_TEST',
          business_manager_name: 'Test Business Manager 1',
          ad_account_id: '123456791',
          spend_cap: 75000, // $750 in cents
          amount_spent: 300,
          timezone_id: 'America/New_York'
        }
      },
      // Ad Accounts for BM_002_TEST
      {
        type: 'ad_account',
        dolphin_id: 'AD_004_TEST',
        name: 'Test Ad Account 4',
        status: 'active',
        metadata: {
          business_manager_id: 'BM_002_TEST',
          business_manager_name: 'Test Business Manager 2', 
          ad_account_id: '123456792',
          spend_cap: 200000, // $2000 in cents
          amount_spent: 500,
          timezone_id: 'America/Los_Angeles'
        }
      },
      {
        type: 'ad_account',
        dolphin_id: 'AD_005_TEST',
        name: 'Test Ad Account 5',
        status: 'active',
        metadata: {
          business_manager_id: 'BM_002_TEST',
          business_manager_name: 'Test Business Manager 2',
          ad_account_id: '123456793', 
          spend_cap: 150000, // $1500 in cents
          amount_spent: 750,
          timezone_id: 'America/Los_Angeles'
        }
      }
    ];

    // Insert all assets
    const allAssets = [...businessManagers, ...adAccounts];
    const { data: insertedAssets, error: insertError } = await supabase
      .from('asset')
      .insert(allAssets)
      .select();

    if (insertError) {
      console.error('Error inserting test assets:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Created ${insertedAssets?.length || 0} test assets`,
      assets: insertedAssets
    });

  } catch (error) {
    console.error('Error creating test assets:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 