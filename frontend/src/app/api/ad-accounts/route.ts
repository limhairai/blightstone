import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // SECURE: Always require authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
        console.error('User profile missing organization_id:', { profileError, profile });
        return NextResponse.json({ 
          accounts: [], 
          message: 'No organization assigned to user. Please contact support.' 
        });
    }
    
    const organizationId = profile.organization_id;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const bmId = searchParams.get('bm_id');

    // Use the NEW schema (asset + asset_binding) via RPC function
    // console.log('🔍 Using NEW schema RPC for ad accounts, organization:', organizationId);

    const { data: assets, error } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'ad_account'
    });

    if (error) {
      console.error('Error fetching ad accounts from NEW schema:', error);
      return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 });
    }

    // Get pending additional ad account applications
    const { data: pendingApplications, error: appsError } = await supabase
      .from('application')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('request_type', 'additional_accounts')
      .in('status', ['pending', 'processing']);

    if (appsError) {
      console.error('Error fetching pending ad account applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch pending applications' }, { status: 500 });
    }

    // Get all business managers for this organization to create a lookup map
    const { data: businessManagers, error: bmError } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'business_manager'
    });

    if (bmError) {
      console.error('Error fetching business managers:', bmError);
    }

    // Get pixel assets for this organization
    const { data: pixelAssets, error: pixelError } = await supabase.rpc('get_organization_assets', {
      p_organization_id: organizationId,
      p_asset_type: 'pixel'
    });

    if (pixelError) {
      console.error('Error fetching pixel assets:', pixelError);
    }

    // Create a lookup map for business manager info: dolphin_id -> {name, id}
    const bmLookup = new Map();
    if (businessManagers) {
      businessManagers.forEach((bm: any) => {
        bmLookup.set(bm.dolphin_id, {
          name: bm.name,
          id: bm.dolphin_id
        });
      });
    }

    // Create a lookup map for pixel info: pixel_id -> pixel data
    const pixelLookup = new Map();
    if (pixelAssets) {
      pixelAssets.forEach((pixel: any) => {
        pixelLookup.set(pixel.dolphin_id, {
          id: pixel.asset_id,
          name: pixel.name,
          dolphin_id: pixel.dolphin_id,
          status: pixel.status,
          is_active: pixel.is_active,
          metadata: pixel.metadata
        });
      });
    }

    // Process active assets
    const processedAssets = (assets || []).map((asset: any) => {
      const metadata = asset.metadata || {};
      const accountId = asset.dolphin_id || metadata.ad_account_id;
      const businessManagerId = metadata.business_manager_id;
      
      // Try to get business manager name from metadata first, then from lookup
      let businessManagerName = metadata.business_manager_name;
      if (!businessManagerName && businessManagerId) {
        const bmInfo = bmLookup.get(businessManagerId);
        businessManagerName = bmInfo?.name || 'Unknown BM';
      }
      if (!businessManagerName) {
        businessManagerName = 'Unknown BM';
      }

      // Get pixel information - first try from metadata, then from pixel assets
      let pixelId = metadata.pixel_id;
      let pixelName = metadata.pixel_name;
      let pixelStatus = 'active';
      let pixelIsActive = true;

      // If no pixel in metadata, check if there's a pixel asset that references this ad account
      if (!pixelId && pixelAssets) {
        // Look for pixel assets that might be associated with this ad account
        // This is a fallback in case the metadata is not properly synced
        const associatedPixel = pixelAssets.find((pixel: any) => {
          const pixelMetadata = pixel.metadata || {};
          const associatedAccounts = pixelMetadata.associated_ad_accounts || [];
          return associatedAccounts.includes(accountId);
        });

        if (associatedPixel) {
          pixelId = associatedPixel.dolphin_id;
          pixelName = associatedPixel.name;
          pixelStatus = associatedPixel.status;
          pixelIsActive = associatedPixel.is_active;
        }
      }

      // Handle status - if asset status is 'pending', try to determine actual status
      let actualStatus = asset.status;
      let actualIsActive = asset.is_active;

      // If status is pending and we have Dolphin metadata, try to infer actual status
      if (actualStatus === 'pending' && metadata.account_status) {
        // Map Dolphin account status to our status values
        const dolphinStatus = metadata.account_status;
        if (dolphinStatus === 'ACTIVE') {
          actualStatus = 'active';
          actualIsActive = true;
        } else if (dolphinStatus === 'PAUSED') {
          actualStatus = 'paused';
          actualIsActive = false;
        } else if (dolphinStatus === 'SUSPENDED' || dolphinStatus === 'RESTRICTED') {
          actualStatus = 'suspended';
          actualIsActive = false;
        }
      }

      // If still pending and we have spend data, assume it's active
      if (actualStatus === 'pending' && (metadata.spend || metadata.balance)) {
        actualStatus = 'active';
        actualIsActive = true;
      }
      
      return {
        id: asset.asset_id,
        adAccount: accountId,
        ad_account_id: accountId, // Add this field
        dolphin_account_id: accountId, // Add this field
        name: asset.name || `Account ${accountId}`,
        status: actualStatus,
        is_active: actualIsActive,
        business: businessManagerName,
        business_manager_name: businessManagerName, // Add this field for frontend compatibility
        business_manager_id: businessManagerId,
        bmId: businessManagerId,
        balance: parseFloat(metadata.balance || '0'),
        balance_cents: Math.round(parseFloat(metadata.balance || '0') * 100),
        spend_cents: Math.round(parseFloat(metadata.spend || '0') * 100),
        spend_cap_cents: Math.round(parseFloat(metadata.spend_limit || '0') * 100),
        currency: metadata.currency || 'USD',
        spend_limit: parseFloat(metadata.spend_limit || '0'),
        timezone: metadata.timezone || 'UTC',
        created_at: asset.created_at,
        updated_at: asset.updated_at,
        type: 'asset', // Mark as active asset
        // Enhanced pixel information
        pixel_id: pixelId,
        pixel_name: pixelName,
        pixel_status: pixelStatus,
        pixel_is_active: pixelIsActive,
        metadata: metadata
      };
    });

    // Process pending applications and add them to the list
    const pendingAdAccounts = (pendingApplications || []).map((app: any) => ({
      id: `app-${app.application_id}`,
      adAccount: `pending-${app.application_id}`,
      name: `Ad Account Request ${app.application_id.toString().substring(0, 8)}...`,
      status: app.status,
      is_active: false,
      business: app.target_bm_dolphin_id ? 'Business Manager' : 'Pending Assignment',
      bmId: app.target_bm_dolphin_id,
      balance: 0,
      currency: 'USD',
      spend_limit: 0,
      created_at: app.created_at,
      updated_at: app.updated_at,
      type: 'application', // Mark as pending application
      application_id: app.application_id,
      pixel_id: null, // Applications don't have pixels yet
      metadata: {}
    }));

    // Apply business manager filter if specified
    let filteredAccounts = [...processedAssets];
    
    // For business manager filtering, only include real ad accounts, not pending applications
    if (bmId) {
      filteredAccounts = processedAssets.filter((account: any) => account.bmId === bmId);
      
      // Only add pending applications if they're specifically for this BM
      const relevantPendingApps = pendingAdAccounts.filter(app => app.bmId === bmId);
      filteredAccounts = [...filteredAccounts, ...relevantPendingApps];
    } else {
      // If no BM filter, include all accounts and applications
      filteredAccounts = [...processedAssets, ...pendingAdAccounts];
    }

    // Sort by created_at (newest first)
    filteredAccounts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const response = NextResponse.json({
      accounts: filteredAccounts,
      total: filteredAccounts.length,
      active_accounts: processedAssets.length,
      pending_applications: pendingAdAccounts.length
    });
    
    // No caching for immediate ad account updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Error in ad accounts API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// TODO: PATCH and DELETE handlers need to be implemented for Dolphin assets
// The current implementation was trying to modify the legacy 'ad_accounts' table
// which causes runtime errors since GET returns Dolphin assets with different IDs.
// 
// These operations should either:
      // 1. Update the binding status in 'asset_binding' table to 'inactive', or  
      // 2. Make API calls to Dolphin Cloud to modify the actual Facebook accounts
//
// For now, these endpoints are removed to prevent data corruption.
// Implement proper Dolphin asset management in a future update.
