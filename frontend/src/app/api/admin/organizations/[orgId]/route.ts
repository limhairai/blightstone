import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch individual organization with businesses
export async function GET(
  request: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    // Single optimized query to get organization, business managers, and ad accounts in one go
    const [orgResult, assetsResult] = await Promise.all([
      // Fetch organization details
      supabase
        .from('organizations')
        .select('*')
        .eq('organization_id', orgId)
        .single(),
      
      // Fetch ALL assets (both BMs and ad accounts) in one query
      supabase
        .from('asset_binding')
        .select(`
          *,
          asset!inner(
            asset_id,
            type,
            dolphin_id,
            name,
            status,
            metadata
          )
        `)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .in('asset.type', ['business_manager', 'ad_account'])
    ]);

    const { data: orgData, error: orgError } = orgResult;
    const { data: allAssets, error: assetsError } = assetsResult;

    if (orgError) {
      if (orgError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      throw orgError
    }

    if (assetsError) {
      throw assetsError
    }

    // Separate business managers and ad accounts
    const businessManagers = allAssets?.filter(binding => binding.asset.type === 'business_manager') || [];
    const adAccounts = allAssets?.filter(binding => binding.asset.type === 'ad_account') || [];

    // Calculate totals efficiently
    const totalAdAccounts = adAccounts.length;
    const totalSpend = adAccounts.reduce((sum, binding) => {
      const amountSpent = binding.asset?.metadata?.amount_spent || 0;
      return sum + amountSpent;
    }, 0);

    // Create a map for faster lookups
    const adAccountsByBM = new Map();
    adAccounts.forEach(adBinding => {
      const bmId = adBinding.asset?.metadata?.business_manager_id;
      if (bmId) {
        if (!adAccountsByBM.has(bmId)) {
          adAccountsByBM.set(bmId, []);
        }
        adAccountsByBM.get(bmId).push(adBinding);
      }
    });

    // Format organization data for frontend
    const organization = {
      id: orgData.organization_id,
      name: orgData.name,
      industry: 'Technology', // Placeholder
      teamId: 'team-1', // Placeholder  
      status: 'active' as const,
      plan: 'professional' as const,
      adAccountsCount: totalAdAccounts,
      description: orgData.description || '',
      tags: [],
      totalSpend: totalSpend,
      balance: 0,
      teamMembersCount: 0
    }

    // Calculate stats for each business manager efficiently
    const businessManagersWithStats = businessManagers.map((binding: any) => {
      const bmId = binding.asset.dolphin_id;
      const bmAdAccounts = adAccountsByBM.get(bmId) || [];
      
      // Calculate total spend for this business manager
      const bmTotalSpend = bmAdAccounts.reduce((sum: number, adBinding: any) => {
        const amountSpent = adBinding.asset?.metadata?.amount_spent || 0;
        return sum + amountSpent;
      }, 0);

      return {
        id: binding.asset.dolphin_id,
        name: binding.asset.name || `Business Manager #${binding.asset.dolphin_id.substring(0, 8)}`,
        status: binding.asset.status,
        organizationId: orgId,
        adAccountsCount: bmAdAccounts.length,
        dolphin_business_manager_id: binding.asset.dolphin_id,
        totalSpend: bmTotalSpend,
        monthlyBudget: 0, // Placeholder for now
        createdAt: binding.bound_at,
      };
    });

    const response = NextResponse.json({
      organization,
      businessManagers: businessManagersWithStats,
    })
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    
    return response
  } catch (error: any) {
    console.error('Error fetching organization details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization details', details: error.message },
      { status: 500 }
    )
  }
} 