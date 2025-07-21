import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildApiUrl } from '../../../lib/api-utils';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
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

    // Check if user is admin/superuser for admin view
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser, organization_id')
      .eq('profile_id', user.id)
      .single();

    const isAdmin = profile?.is_superuser === true;
    
    // Set up auth context for RLS
    await supabase.auth.setSession({ access_token: token, refresh_token: '' });

    let query = supabase
      .from('topup_requests')
      .select(`
        *,
        organization:organizations(name)
      `)
      .order('created_at', { ascending: false });

    // SECURITY FIX: Always filter by user's organizations, regardless of admin status
    // Admin status should only affect admin panel, not client dashboard
    // Get organizations where user is owner
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from('organizations')
      .select('organization_id')
      .eq('owner_id', user.id);

    // Get organizations where user is a member
    const { data: memberOrgs, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id);

    if (ownedError || memberError) {
      console.error('Error fetching user organizations:', ownedError || memberError);
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
    }

    const ownedOrgIds = ownedOrgs?.map(org => org.organization_id) || [];
    const memberOrgIds = memberOrgs?.map(org => org.organization_id) || [];
    const allOrgIds = [...new Set([...ownedOrgIds, ...memberOrgIds])];

    if (allOrgIds.length === 0) {
      return NextResponse.json([]);
    }

    // Always filter by user's organizations - admin or not
    query = query.in('organization_id', allOrgIds);

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Error fetching topup requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch topup requests' }, { status: 500 });
    }

    // Get user details for each request and enhance business manager info
    const requestsWithUserData = await Promise.all(
      (requests || []).map(async (request) => {
        // Get user profile data
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('profile_id', request.requested_by)
          .single();

        // Enhance business manager information if missing or incomplete
        let enhancedMetadata = { ...request.metadata };
        
        // Check if BM info is missing or incomplete
        const needsBMInfo = !enhancedMetadata?.business_manager_name || 
                           enhancedMetadata.business_manager_name === 'Unknown' ||
                           enhancedMetadata.business_manager_name === 'BM Not Available';

        if (needsBMInfo && request.organization_id) {
          try {
            // Try to find the ad account in the asset system to get BM info
            if (request.ad_account_id && request.ad_account_id !== 'Account ID Not Available') {
              // First get the asset_binding for this organization and ad account
              const { data: assetBindings } = await supabase
                .from('asset_binding')
                .select('asset_id')
                .eq('organization_id', request.organization_id)
                .eq('status', 'active');

              if (assetBindings && assetBindings.length > 0) {
                // Then find the matching asset by dolphin_id
                const { data: adAccountAsset } = await supabase
                  .from('asset')
                  .select('name, dolphin_id, metadata, type, asset_id')
                  .eq('dolphin_id', request.ad_account_id)
                  .eq('type', 'ad_account')
                  .in('asset_id', assetBindings.map(b => b.asset_id))
                  .single();

                if (adAccountAsset?.metadata) {
                  const assetMetadata = adAccountAsset.metadata;
                  if (assetMetadata.business_manager_name || assetMetadata.business_manager) {
                    enhancedMetadata.business_manager_name = assetMetadata.business_manager_name || assetMetadata.business_manager;
                    enhancedMetadata.business_manager_id = assetMetadata.business_manager_id || enhancedMetadata.business_manager_id;
                  }
                }
              }
            }

            // If still no BM info, get any BM from the organization as fallback
            if (!enhancedMetadata.business_manager_name || enhancedMetadata.business_manager_name === 'Unknown') {
              // First get asset_bindings for business managers in this organization
              const { data: bmBindings } = await supabase
                .from('asset_binding')
                .select('asset_id')
                .eq('organization_id', request.organization_id)
                .eq('status', 'active');

              if (bmBindings && bmBindings.length > 0) {
                // Then find a business manager asset
                const { data: anyBM } = await supabase
                  .from('asset')
                  .select('name, dolphin_id, type, asset_id')
                  .eq('type', 'business_manager')
                  .in('asset_id', bmBindings.map(b => b.asset_id))
                  .limit(1)
                  .single();

                if (anyBM) {
                  enhancedMetadata.business_manager_name = anyBM.name || 'BM Not Available';
                  enhancedMetadata.business_manager_id = anyBM.dolphin_id || 'BM ID Not Available';
                }
              }
            }
          } catch (error) {
            console.error('Error enhancing BM info for request:', request.request_id, error);
            // Continue with existing metadata if enhancement fails
          }
        }

        return {
          ...request,
          id: request.request_id, // Map request_id to id for frontend compatibility
          metadata: enhancedMetadata,
          requested_by_user: userProfile ? {
            email: userProfile.email,
            full_name: userProfile.full_name
          } : null
        };
      })
    );

    const response = NextResponse.json(requestsWithUserData);
    
    // No caching for immediate topup request updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;

  } catch (error) {
    console.error('Error in topup-requests GET API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, approved_amount } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const url = new URL(request.url);
    const requestId = url.pathname.split('/').pop();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Update the topup request (using correct table name)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('topup_requests')
      .update({
        status,
        approved_amount_cents: status === 'completed' && approved_amount ? approved_amount * 100 : null,
        processed_by: user.id,
        processed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating topup request:', updateError);
      return NextResponse.json({ error: 'Failed to update topup request' }, { status: 500 });
    }

    // Trigger cache invalidation for immediate UI updates when status changes
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          organizationId: updatedRequest.organization_id,
          type: 'wallet'
        })
      })
      console.log(`✅ Wallet cache invalidated for org: ${updatedRequest.organization_id}`)
    } catch (cacheError) {
      console.error('Failed to invalidate wallet cache:', cacheError)
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json({ 
      message: 'Topup request updated successfully',
      request: {
        ...updatedRequest,
        id: updatedRequest.request_id // Map request_id to id for frontend compatibility
      }
    });

  } catch (error) {
    console.error('Error in topup-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      organization_id, 
      ad_account_id, 
      ad_account_name, 
      amount_cents, 
      fee_amount_cents,
      total_deducted_cents,
      plan_fee_percentage,
      metadata,
      request_type = 'topup',
      transfer_destination_type,
      transfer_destination_id
    } = body;

    if (!organization_id || !ad_account_id || !ad_account_name || !amount_cents) {
      console.error('Missing required fields for topup request:', {
        organization_id: !!organization_id,
        ad_account_id: !!ad_account_id,
        ad_account_name: !!ad_account_name,
        amount_cents: !!amount_cents,
        body: JSON.stringify(body, null, 2)
      })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate request type
    if (request_type && !['topup', 'balance_reset'].includes(request_type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    // Validate balance reset specific fields
    if (request_type === 'balance_reset') {
      if (!transfer_destination_type || !['wallet', 'ad_account'].includes(transfer_destination_type)) {
        return NextResponse.json({ error: 'Invalid transfer destination type for balance reset' }, { status: 400 });
      }
      if (!transfer_destination_id) {
        return NextResponse.json({ error: 'Transfer destination ID is required for balance reset' }, { status: 400 });
      }
    }

    // Validate minimum amount for topup requests
    if (request_type === 'topup' && amount_cents < 10000) { // $100 minimum for topups
      console.error('Amount too low for topup request:', {
        amount_cents,
        minimum_required: 10000,
        amount_dollars: amount_cents / 100,
        minimum_dollars: 100
      })
      return NextResponse.json({ error: 'Minimum top-up amount is $100' }, { status: 400 });
    }

    // Validate minimum amount for balance reset requests
    if (request_type === 'balance_reset' && amount_cents < 100) { // $1 minimum for balance reset
      return NextResponse.json({ error: 'Minimum balance reset amount is $1' }, { status: 400 });
    }

    // Check top-up limits for topup requests (only if feature is enabled)
    if (request_type === 'topup') {
      // Import the feature flag and pricing config
      const { shouldEnableTopupLimits, getPlanPricing } = await import('@/lib/config/pricing-config');
      
      if (shouldEnableTopupLimits()) {
        // Get organization plan from database
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('plan_id')
          .eq('organization_id', organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization plan:', orgError);
          return NextResponse.json({ error: 'Failed to validate request limits' }, { status: 500 });
        }

        // Get plan limits from pricing config (single source of truth)
        const planId = orgData.plan_id as 'starter' | 'growth' | 'scale';
        const planLimits = getPlanPricing(planId);
        
        if (planLimits) {
          // Handle infinite limits (represented as -1)
          const hasInfiniteLimit = planLimits.monthlyTopupLimit === -1;
          
          if (!hasInfiniteLimit) {
            const monthlyLimitCents = planLimits.monthlyTopupLimit * 100; // Convert to cents
            
            // Get current month's usage
            const currentMonthStart = new Date();
            currentMonthStart.setDate(1);
            currentMonthStart.setHours(0, 0, 0, 0);
            
            const { data: topupData, error: topupError } = await supabase
              .from('topup_requests')
              .select('amount_cents')
              .eq('organization_id', organization_id)
              .in('status', ['pending', 'processing', 'completed'])
              .gte('created_at', currentMonthStart.toISOString());

            if (topupError) {
              console.error('Error fetching topup usage:', topupError);
              return NextResponse.json({ error: 'Failed to validate request limits' }, { status: 500 });
            }

            const currentUsageCents = topupData.reduce((sum, req) => sum + req.amount_cents, 0);
            const availableCents = monthlyLimitCents - currentUsageCents;
            
            // Check if request would exceed limit (only for non-infinite limits)
            if (currentUsageCents + amount_cents > monthlyLimitCents) {
              const limitInDollars = `$${(monthlyLimitCents / 100).toLocaleString()}`;
            const usageInDollars = `$${(currentUsageCents / 100).toLocaleString()}`;
            
            return NextResponse.json({ 
              error: `Monthly top-up limit exceeded. Your ${planId} plan allows ${limitInDollars} per month, and you've already used ${usageInDollars} this month.`,
              limitInfo: {
                limit: monthlyLimitCents / 100,
                currentUsage: currentUsageCents / 100,
                available: availableCents / 100
              }
            }, { status: 400 });
            }
          }
        }
      }
    }

    // Get organization's current plan for fee calculation if not provided
    // Note: Balance reset requests don't have fees, only topup requests do
    let calculatedFeeData = {
      fee_amount_cents: fee_amount_cents || 0,
      total_deducted_cents: total_deducted_cents || amount_cents,
      plan_fee_percentage: plan_fee_percentage || 0
    };

    if (request_type === 'topup' && (!fee_amount_cents || !plan_fee_percentage)) {
      // Import the feature flag
      const { shouldEnableAdSpendFees, getPlanPricing } = await import('@/lib/config/pricing-config');
      
      if (shouldEnableAdSpendFees()) {
        // Calculate fee using subscription service
        try {
          console.log(`🔍 DEBUG: Calculating fee for amount: $${amount_cents / 100} (${amount_cents} cents)`);
          
          const feeResponse = await fetch(buildApiUrl('/subscriptions/calculate-fee'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              organization_id,
              amount: amount_cents / 100
            })
          });

          if (feeResponse.ok) {
            const feeData = await feeResponse.json();
            console.log(`🔍 DEBUG: Backend fee response:`, feeData);
            
            calculatedFeeData = {
              fee_amount_cents: Math.round(feeData.fee_amount * 100),
              total_deducted_cents: Math.round(feeData.total_amount * 100),
              plan_fee_percentage: feeData.fee_percentage
            };
            
            console.log(`🔍 DEBUG: Calculated fee data:`, calculatedFeeData);
          } else {
            console.error('Fee calculation failed:', feeResponse.status, await feeResponse.text());
            // Use no fee as fallback (new pricing model has 0% for Growth/Scale)
            calculatedFeeData = {
              fee_amount_cents: 0,
              total_deducted_cents: amount_cents,
              plan_fee_percentage: 0
            };
            
            console.log(`🔍 DEBUG: Using fallback fee calculation (0%):`, calculatedFeeData);
          }
        } catch (error) {
          console.error('Error calculating fee:', error);
          // Use no fee as fallback (new pricing model has 0% for Growth/Scale)
          calculatedFeeData = {
            fee_amount_cents: 0,
            total_deducted_cents: amount_cents,
            plan_fee_percentage: 0
          };
          
          console.log(`🔍 DEBUG: Using fallback fee calculation after error (0%):`, calculatedFeeData);
        }
      } else {
        // No fees in new pricing model
        calculatedFeeData = {
          fee_amount_cents: 0,
          total_deducted_cents: amount_cents,
          plan_fee_percentage: 0
        };
        
        console.log(`🔍 DEBUG: No fees applied (feature disabled):`, calculatedFeeData);
      }
    }

    // Create request with fee tracking (for topup) or balance reset data
    const insertData: any = {
      organization_id,
      requested_by: user.id,
      ad_account_id,
      ad_account_name,
      amount_cents,
              currency: 'USD',
        status: 'pending',
        fee_amount_cents: calculatedFeeData.fee_amount_cents,
      total_deducted_cents: calculatedFeeData.total_deducted_cents,
      plan_fee_percentage: calculatedFeeData.plan_fee_percentage,
      metadata: metadata || {},
      request_type: request_type || 'topup'
    };

    console.log(`🔍 DEBUG: Final insert data:`, {
      amount_cents: insertData.amount_cents,
      fee_amount_cents: insertData.fee_amount_cents,
      total_deducted_cents: insertData.total_deducted_cents,
      plan_fee_percentage: insertData.plan_fee_percentage
    });

    // Add balance reset specific fields
    if (request_type === 'balance_reset') {
      insertData.transfer_destination_type = transfer_destination_type;
      insertData.transfer_destination_id = transfer_destination_id;
    }

    const { data: topupRequest, error: insertError } = await supabase
      .from('topup_requests')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating topup request:', insertError);
      
      // Check if the error is due to insufficient balance
      if (insertError.message?.includes('Insufficient available balance')) {
        return NextResponse.json({ 
          error: 'Insufficient available balance for this topup request. Please check your wallet balance and any pending requests.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: 'Failed to create topup request' }, { status: 500 });
    }

    // Trigger comprehensive cache invalidation for immediate UI updates
    try {
      // Method 1: Call internal cache invalidation endpoint
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      await fetch(`${baseUrl}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CACHE_INVALIDATION_SECRET || 'internal-cache-invalidation'}`
        },
        body: JSON.stringify({
          organizationId: organization_id,
          type: 'wallet'
        })
      })
      
      // Method 2: Clear server-side cache for organizations endpoint
      // This is critical because the wallet balance comes from /api/organizations
      const orgCache = global.orgCache || new Map()
      const userCacheKeys = Array.from(orgCache.keys()).filter(key => key.includes(organization_id))
      userCacheKeys.forEach(key => orgCache.delete(key))
      
      console.log(`✅ Comprehensive wallet cache invalidated for org: ${organization_id}`)
    } catch (cacheError) {
      console.error('Failed to invalidate wallet cache:', cacheError)
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json({ 
      message: request_type === 'balance_reset' ? 'Balance reset request created successfully' : 'Topup request created successfully',
      request: {
        ...topupRequest,
        id: topupRequest.request_id // Map request_id to id for frontend compatibility
      }
    });

  } catch (error) {
    console.error('Error in topup-requests POST API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 