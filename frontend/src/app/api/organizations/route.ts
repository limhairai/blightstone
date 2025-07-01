import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('id');
    
    // console.log(`🔍 Organizations API called: ${orgId ? `specific org ${orgId}` : 'all orgs'}`);
    
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

    // Build query differently for specific org vs all orgs to handle membership issues
    let orgs, error;
    
    if (orgId) {
      // For specific organization, check if user owns it OR is a member
      // First try to get the organization if they own it
      const { data: ownedOrg, error: ownedError } = await supabase
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
        
      if (ownedOrg && !ownedError) {
        // User owns this organization, return it even if they're not in organization_members
        orgs = [ownedOrg];
        error = null;
      } else {
        // Check if they're a member of this organization
        const { data: memberOrg, error: memberError } = await supabase
          .from('organizations')
          .select(`
            organization_id,
            name,
            created_at,
            organization_members!inner(user_id),
            wallets(wallet_id, balance_cents, reserved_balance_cents)
          `)
          .eq('organization_members.user_id', user.id)
          .eq('organization_id', orgId)
          .maybeSingle();
          
        orgs = memberOrg ? [memberOrg] : [];
        error = memberError;
      }
    } else {
      // For all organizations, get both owned and member organizations
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
        
        // Organizations the user is a member of (but doesn't own)
        supabase
          .from('organizations')
          .select(`
            organization_id,
            name,
            created_at,
            organization_members!inner(user_id),
            wallets(wallet_id, balance_cents, reserved_balance_cents)
          `)
          .eq('organization_members.user_id', user.id)
          .neq('owner_id', user.id) // Exclude owned orgs to avoid duplicates
      ]);
      
      // Combine results
      const ownedOrgs = ownedResult.data || [];
      const memberOrgs = memberResult.data || [];
      orgs = [...ownedOrgs, ...memberOrgs];
      error = ownedResult.error || memberResult.error;
    }

    if (error) {
      console.error("Error fetching organizations:", error);
      throw error;
    }

    // If no organizations found, return empty array instead of error
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ organizations: [] });
    }

    // Get business manager count for each organization using our new asset system
    const mappedOrgs = await Promise.all((orgs || []).map(async (org) => {
      // Count business managers bound to this organization
      let bmCount = 0;
      try {
        const { data: bmAssets, error: bmError } = await supabase.rpc('get_organization_assets', {
          p_organization_id: org.organization_id,
          p_asset_type: 'business_manager'
        });

        if (!bmError) {
          bmCount = bmAssets?.length || 0;
        }
      } catch (error) {
        console.error('Error fetching BM count for org:', org.organization_id, error);
      }

      // Calculate available balance (total - reserved)
      const totalBalance = org.wallets?.balance_cents || 0;
      const reservedBalance = org.wallets?.reserved_balance_cents || 0;
      const availableBalance = totalBalance - reservedBalance;

      return {
        ...org,
        id: org.organization_id, // Map organization_id to id for frontend compatibility
        business_count: bmCount, // Keep field name for backward compatibility
        balance_cents: availableBalance, // Return available balance instead of total
        balance: availableBalance / 100, // Convert cents to dollars for backward compatibility
        total_balance_cents: totalBalance, // Include total balance for reference
        reserved_balance_cents: reservedBalance // Include reserved balance for transparency
      };
    }));

    return NextResponse.json({ organizations: mappedOrgs });
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
    const { name } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    // Verify user has permission to update this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { data: updatedOrg, error } = await supabase
      .from('organizations')
      .update({ name })
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw error;

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