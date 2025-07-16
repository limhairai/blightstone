import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get pagination parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '25', 10)
        const search = searchParams.get('search')
        const status = searchParams.get('status')
        
        // Build organizations query with pagination
        let organizationsQuery = supabase
            .from('organizations')
            .select(`
                organization_id, 
                name, 
                created_at,
                plan_id,
                subscription_status,
                current_period_start,
                current_period_end
            `, { count: 'exact' })
        
        // Add filters
        if (search) {
            organizationsQuery = organizationsQuery.ilike('name', `%${search}%`)
        }
        
        if (status) {
            organizationsQuery = organizationsQuery.eq('subscription_status', status)
        }
        
        // Add pagination
        const offset = (page - 1) * limit
        organizationsQuery = organizationsQuery
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })
        
        // Fetch organizations first
        const { data: organizations, error, count } = await organizationsQuery;
        
        if (error) {
            console.error('Error fetching organizations:', error);
            throw error;
        }

        // Fetch wallets separately
        const { data: wallets, error: walletError } = await supabase
            .from('wallets')
            .select('organization_id, balance_cents, reserved_balance_cents');
        
        if (walletError) {
            console.error('Error fetching wallets:', walletError);
        }

        // Create wallet map
        const walletMap = new Map();
        wallets?.forEach((wallet: any) => {
            walletMap.set(wallet.organization_id, wallet);
        });

        // Get asset counts for all organizations (BMs, ad accounts, and pixels)
        const { data: assetCounts, error: assetError } = await supabase
            .from('asset_binding')
            .select(`
                organization_id,
                asset!inner(type, metadata)
            `)
            .eq('status', 'active');

        if (assetError) {
            console.error('Error fetching asset counts:', assetError);
        }

        // Create maps for different asset counts
        const bmCountMap = new Map<string, number>();
        const adAccountCountMap = new Map<string, number>();
        const pixelCountMap = new Map<string, Set<string>>(); // Use Set to avoid duplicate pixels

        assetCounts?.forEach((binding: any) => {
            const orgId = binding.organization_id;
            const assetType = binding.asset.type;
            
            if (assetType === 'business_manager') {
                bmCountMap.set(orgId, (bmCountMap.get(orgId) || 0) + 1);
            } else if (assetType === 'ad_account') {
                adAccountCountMap.set(orgId, (adAccountCountMap.get(orgId) || 0) + 1);
                
                // Check if this ad account has pixel data
                const metadata = binding.asset.metadata || {};
                const pixelId = metadata.pixel_id;
                if (pixelId) {
                    if (!pixelCountMap.has(orgId)) {
                        pixelCountMap.set(orgId, new Set());
                    }
                    pixelCountMap.get(orgId)!.add(pixelId);
                }
            }
        });

        // Transform organizations with additional data
        const transformedOrganizations = organizations?.map((org: any) => {
            const wallet = walletMap.get(org.organization_id);
            const totalBalance = wallet?.balance_cents || 0;
            const reservedBalance = wallet?.reserved_balance_cents || 0;
            const availableBalance = totalBalance - reservedBalance;
            
            return {
                organization_id: org.organization_id,
                name: org.name,
                created_at: org.created_at,
                plan_id: org.plan_id,
                subscription_status: org.subscription_status,
                current_period_start: org.current_period_start,
                current_period_end: org.current_period_end,
                balance_cents: totalBalance, // Fixed: Use total balance, not available balance
                available_balance_cents: availableBalance,
                reserved_balance_cents: reservedBalance,
                business_managers_count: bmCountMap.get(org.organization_id) || 0,
                ad_accounts_count: adAccountCountMap.get(org.organization_id) || 0,
                pixels_count: pixelCountMap.get(org.organization_id)?.size || 0
            };
        }) || [];

        return NextResponse.json({ 
            organizations: transformedOrganizations,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
                hasMore: (page * limit) < (count || 0)
            }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 