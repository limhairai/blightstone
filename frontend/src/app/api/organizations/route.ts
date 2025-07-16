import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// **PERFORMANCE**: Simple in-memory cache for organizations
const orgCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 1000; // Reduced to 5 seconds for immediate wallet balance updates

// Export cache for external invalidation
if (typeof global !== 'undefined') {
  global.orgCache = orgCache;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // **PERFORMANCE**: Check server-side cache first
    const cacheKey = `${user.id}-${orgId || 'all'}`;
    const cached = orgCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const response = NextResponse.json(cached.data);
      response.headers.set('Cache-Control', 'public, max-age=10, s-maxage=10');
      response.headers.set('Vary', 'Authorization');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // **OPTIMIZED**: Use basic queries with correct semantic IDs
    let organizations;

    if (orgId) {
      // Get specific organization
      const { data: specificOrg, error: specificError } = await supabase
        .from('organizations')
        .select(`
          organization_id,
          name,
          created_at,
          owner_id,
          wallets(wallet_id, balance_cents, reserved_balance_cents)
        `)
        .eq('organization_id', orgId)
        .eq('owner_id', user.id)
        .maybeSingle();
        
      organizations = specificOrg ? [specificOrg] : [];
      
      if (specificError) {
        console.error("Error fetching specific organization:", specificError);
        return NextResponse.json({ error: 'Failed to fetch organization', details: specificError.message }, { status: 500 });
      }
    } else {
      // **FIXED**: Get organizations using separate queries to avoid OR syntax issues
      const [ownedResult, memberResult] = await Promise.all([
        // Organizations the user owns
        supabase
          .from('organizations')
          .select(`
            organization_id,
            name,
            created_at,
            owner_id,
            wallets(wallet_id, balance_cents, reserved_balance_cents)
          `)
          .eq('owner_id', user.id),
        
        // Organizations the user is a member of
        supabase
          .from('organizations')
          .select(`
            organization_id,
            name,
            created_at,
            owner_id,
            organization_members!inner(user_id),
            wallets(wallet_id, balance_cents, reserved_balance_cents)
          `)
          .eq('organization_members.user_id', user.id)
          .neq('owner_id', user.id) // Exclude owned orgs to avoid duplicates
      ]);
      
      if (ownedResult.error) {
        console.error("Error fetching owned organizations:", ownedResult.error);
        return NextResponse.json({ error: 'Failed to fetch owned organizations', details: ownedResult.error.message }, { status: 500 });
      }
      
      if (memberResult.error) {
        console.error("Error fetching member organizations:", memberResult.error);
        return NextResponse.json({ error: 'Failed to fetch member organizations', details: memberResult.error.message }, { status: 500 });
      }
      
      // Combine results
      const ownedOrgs = ownedResult.data || [];
      const memberOrgs = memberResult.data || [];
      organizations = [...ownedOrgs, ...memberOrgs];
    }

    // If no organizations found, return empty array
    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    // **OPTIMIZED**: Get business manager counts using correct semantic IDs
    const orgIds = organizations.map(org => org.organization_id);
    
    const { data: bmCounts, error: bmError } = await supabase
      .from('asset_binding')
      .select(`
        organization_id,
        asset!inner(type)
      `)
      .in('organization_id', orgIds)
      .eq('asset.type', 'business_manager')
      .eq('status', 'active');

    // Count business managers by organization
    const bmCountMap = new Map();
    if (!bmError && bmCounts) {
      bmCounts.forEach(binding => {
        const orgId = binding.organization_id;
        bmCountMap.set(orgId, (bmCountMap.get(orgId) || 0) + 1);
      });
    }

    // **OPTIMIZED**: Map organizations with business manager counts
    const mappedOrgs = organizations.map(org => {
      // Calculate available balance (total - reserved)
      // Handle both array and object formats from Supabase
      const wallet = Array.isArray(org.wallets) ? org.wallets[0] : org.wallets;
      const totalBalance = wallet?.balance_cents || 0;
      const reservedBalance = wallet?.reserved_balance_cents || 0;
      const availableBalance = totalBalance - reservedBalance;

      return {
        organization_id: org.organization_id,
        id: org.organization_id, // Map organization_id to id for frontend compatibility
        name: org.name,
        created_at: org.created_at,
        owner_id: org.owner_id,
        business_count: bmCountMap.get(org.organization_id) || 0, // Use calculated count
        balance_cents: availableBalance,
        balance: availableBalance / 100,
        total_balance_cents: totalBalance,
        reserved_balance_cents: reservedBalance,
        wallets: wallet ? {
          wallet_id: wallet.wallet_id,
          balance_cents: totalBalance,
          reserved_balance_cents: reservedBalance
        } : null
      };
    });

    const responseData = { organizations: mappedOrgs };
    
    // **PERFORMANCE**: Cache the result server-side
    orgCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    
    const response = NextResponse.json(responseData);
    
    // **PERFORMANCE**: Add optimized caching headers
    response.headers.set('Cache-Control', 'private, max-age=30, s-maxage=30, stale-while-revalidate=60')
    response.headers.set('Vary', 'Authorization')
    response.headers.set('X-Cache', 'MISS')
    
    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching organizations:', msg);
    return NextResponse.json({ error: 'Failed to fetch organizations', details: msg }, { status: 500 });
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }
    
    // Create the organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: name, owner_id: user.id })
      .select()
      .single();

    if (orgError) throw orgError;

    // Add the creator as an 'owner' in the members table
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: newOrg.organization_id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    return NextResponse.json(newOrg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating organization:', msg);
    return NextResponse.json({ error: 'Failed to create organization', details: msg }, { status: 500 });
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
    
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');
    const updateData = await request.json();

    // If no orgId provided, update the user's current organization
    let targetOrgId = orgId;
    if (!targetOrgId) {
      // First try to get user's organization via membership
      const { data: orgMembership, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (orgMembership) {
        targetOrgId = orgMembership.organization_id;
      } else {
        // Fallback: get organization via profile (for users created by handle_new_user)
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('profile_id', user.id)
          .single();

        if (profile?.organization_id) {
          targetOrgId = profile.organization_id;
        } else {
          return NextResponse.json({ error: 'User is not associated with any organization.' }, { status: 403 });
        }
      }
    }

    // Verify user has permission to update this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', targetOrgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build update object with only provided fields
    const updateFields: any = {};
    if (updateData.name) updateFields.name = updateData.name;
    if (updateData.ad_spend_monthly) updateFields.ad_spend_monthly = updateData.ad_spend_monthly;
    if (updateData.industry) updateFields.industry = updateData.industry;
    if (updateData.timezone) updateFields.timezone = updateData.timezone;
    if (updateData.how_heard_about_us) updateFields.how_heard_about_us = updateData.how_heard_about_us;
    if (updateData.additional_info) updateFields.additional_info = updateData.additional_info;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update(updateFields)
      .eq('organization_id', targetOrgId)
      .select()
      .single();

    if (error) throw error;

    // Clear cache for this organization
    const cacheKey = `${user.id}-${targetOrgId}`;
    orgCache.delete(cacheKey);
    orgCache.delete(`${user.id}-all`);

    return NextResponse.json(updatedOrg);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating organization:', msg);
    return NextResponse.json({ error: 'Failed to update organization', details: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user is the owner of this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only organization owners can delete organizations' }, { status: 403 });
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('organization_id', orgId);

    if (error) throw error;

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting organization:', msg);
    return NextResponse.json({ error: 'Failed to delete organization', details: msg }, { status: 500 });
  }
} 