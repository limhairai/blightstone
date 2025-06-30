import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { businessId } = params;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    // Fetch business details with organization info
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(`
        *,
        organization:organizations (
          id,
          name
        )
      `)
      .eq('id', businessId)
      .single();

    if (businessError) {
      if (businessError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }
      throw businessError;
    }

    // Verify user has access to this business's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.organization_id !== business.organization_id) {
      return NextResponse.json({ error: 'Access denied to this business' }, { status: 403 });
    }

    // Fetch ad accounts for this business
    const { data: adAccounts, error: adAccountsError } = await supabase
      .from('ad_accounts')
      .select(`
        *,
        business_manager:business_managers!inner (
          dolphin_business_manager_id,
          organization_id
        )
      `)
      .eq('business_managers.organization_id', profile.organization_id);

    if (adAccountsError) {
      console.error('Error fetching ad accounts:', adAccountsError);
      // Don't fail the whole request if ad accounts can't be fetched
    }

    // Enrich ad accounts with business manager names from asset table
    let enrichedAdAccounts = [];
    if (adAccounts && adAccounts.length > 0) {
      const bmDolphinIds = [...new Set(adAccounts.map(acc => acc.business_manager?.dolphin_business_manager_id).filter(Boolean))];
      
      if (bmDolphinIds.length > 0) {
        const { data: bmAssets } = await supabase
          .from('asset')
          .select('dolphin_id, name')
          .in('dolphin_id', bmDolphinIds)
          .eq('type', 'business_manager');

        const bmNameMap = new Map(bmAssets?.map(asset => [asset.dolphin_id, asset.name]));

        enrichedAdAccounts = adAccounts.map(acc => ({
          ...acc,
          business_manager_name: bmNameMap.get(acc.business_manager?.dolphin_business_manager_id) || 'Unknown BM'
        }));
      } else {
        enrichedAdAccounts = adAccounts;
      }
    }

    return NextResponse.json({
      business,
      adAccounts: enrichedAdAccounts
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error fetching business details:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 